import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact } from '../project';
import { IStream } from '../stream';
import { EntityService } from '../entities.service';
import * as _ from 'lodash';
import { iter } from '../utils';

export type Primitive = boolean | null | number | string;

export type FetchByArtifactConfigFilterValue = Primitive | {
  coalesce?: FetchByArtifactConfigFilterValue[];
  get?: string;
  getRoot?: string;
  if?: {
    condition: Record<string, FetchByArtifactConfigFilter>;
    then: FetchByArtifactConfigFilterValue;
    else: FetchByArtifactConfigFilterValue;
  }
  param?: string;
};

export interface FetchByArtifactConfigFilter {
  and?: Record<string, FetchByArtifactConfigFilter>[];
  contains?: FetchByArtifactConfigFilterValue;
  eq?: FetchByArtifactConfigFilterValue;
  gte?: FetchByArtifactConfigFilterValue;
  if?: {
    condition: Record<string, FetchByArtifactConfigFilter>;
    then: Record<string, FetchByArtifactConfigFilter>;
    else?: Record<string, FetchByArtifactConfigFilter>;
  };
  in?: FetchByArtifactConfigFilterValue;
  lte?: FetchByArtifactConfigFilterValue;
  ne?: FetchByArtifactConfigFilterValue;
  notEmpty?: boolean;
  or?: Record<string, FetchByArtifactConfigFilter>[];
  pattern?: RegExp | string;
}

export type FetchByArtifactConfig = Record<string, {
  keys: ({
    title: string;
    to?: string;
    type: string;
    valueMapping?: Record<string, any>;
    valuePath: string;
  } | number | string)[];
  filter?: Record<string, FetchByArtifactConfigFilter>;
  pattern?: RegExp | string;
  source: string;
  sourcePath?: string;
  type: string;
}>;

@Service()
export class FetchByArtifactService extends EntityService implements IArtifactService {
  static readonly assertType: string = '*';
  static readonly type: string = 'fetchBy';

  constructor(public readonly config?: FetchByArtifactConfig) {
    super();
  }

  async run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: IStream,
    params?: Record<string, any>,
  ): Promise<void> {
    if (!this.config) {
      return;
    }

    for (const [ defId, defConfig ] of Object.entries(this.config)) {
      if (!defConfig.keys?.length) {
        continue;
      }

      for (const [ , source ] of iter(
        _.get(entity.scope, defConfig.source),
        defConfig.filter
          ? (val) => FetchByArtifactService.filter(
            val,
            defConfig.filter,
            params
          )
          : undefined,
      )) {
        let matches = defConfig.sourcePath
          ? _.get(source, defConfig.sourcePath)
          : source;

        if (typeof source === 'string' && defConfig.pattern) {
          if (!(defConfig.pattern instanceof RegExp)) {
            defConfig.pattern = new RegExp(defConfig.pattern);
          }

          matches = (defConfig.pattern as RegExp).exec(source);
        }

        if (matches != undefined) {
          for (const key of defConfig.keys) {
            let artifactId;
            let artifactKey;
            let artifactTo;
            let artifactType;
            let artifactVal;
            let artifactValueMapping;

            if (typeof key === 'number' || typeof key === 'string') {
              artifactId = typeof key !== 'string' ? defId : key;
              artifactKey = typeof key !== 'string' ? defId : key;
              artifactTo = 'description';
              artifactType = defConfig.type ?? defId;
              artifactVal = typeof matches === 'object'
                ? _.get(matches, key)
                : matches;
              artifactValueMapping = null;
            } else {
              artifactId = key.title ?? defId;
              artifactKey = key.title ?? defId;
              artifactTo = key.to ?? 'description';
              artifactType = key.type ?? defConfig.type ?? defId;
              artifactVal = typeof matches === 'object'
                ? _.get(matches, key.valuePath)
                : matches;
              artifactValueMapping = key.valueMapping;
            }

            if (artifactVal != null && artifactValueMapping) {
              artifactVal = artifactValueMapping[artifactVal];
            }

            if (artifactVal != null) {
              let artifact = streamState.history.artifact.find(
                (artifact) => artifact.id === artifactId && artifact.type === artifactType
              );

              if (!artifact) {
                artifact = {
                  id: artifactId,
                  type: artifactType,
                  author: null,
                  description: artifactVal,
                  link: null,
                  metadata: {},
                  steps: null,
                  time: null,
                };

                streamState.history.artifact.push(artifact);
              }

              artifact.metadata[artifactKey] = artifactVal;

              if (artifactTo) {
                artifact[artifactTo] = artifactVal;
              }
            }
          }
        }
      }
    }
  }

  private static filter(
    entity: unknown,
    filter: Record<string, FetchByArtifactConfigFilter>,
    params: Record<string, unknown>,
  ) {
    for (const [ key, condition ] of Object.entries(filter)) {
      const val = key !== '...' ? _.get(entity, key) : entity;

      if (condition.notEmpty && (val == null || val === '')) {
        return false;
      }

      if (condition.and) {
        if (condition.and.some((condition) => !FetchByArtifactService.filter(
          val,
          condition,
          params,
        ))) {
          return false;
        }
      }

      if (condition.or) {
        if (condition.or.every((condition) => !FetchByArtifactService.filter(
          val,
          condition,
          params,
        ))) {
          return false;
        }
      }

      if (condition.if) {
        const check = FetchByArtifactService.filter(val, condition.if.condition, params);

        if (check) {
          if (!FetchByArtifactService.filter(val, condition.if.then, params)) {
            return false;
          }
        } else if (condition.if.else) {
          if (!FetchByArtifactService.filter(val, condition.if.else, params)) {
            return false;
          }
        }
      }

      if (condition.contains && !val?.includes(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.contains,
        params,
      ))) {
        return false;
      }

      if (condition.eq !== undefined && val !== FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.eq,
        params,
      )) {
        return false;
      }

      if (condition.gte !== undefined && val <= FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.gte,
        params,
      )) {
        return false;
      }

      if (condition.in && !FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.in,
        params,
      )?.includes(val)) {
        return false;
      }

      if (condition.lte !== undefined && val >= FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.lte,
        params,
      )) {
        return false;
      }

      if (condition.ne !== undefined && val === FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.ne,
        params,
      )) {
        return false;
      }

      if (condition.pattern && typeof val === 'string') {
        if (!(condition.pattern instanceof RegExp)) {
          condition.pattern = new RegExp(condition.pattern);
        }

        if (!(condition.pattern as RegExp).test(val)) {
          return false;
        }
      }
    }

    return true;
  }

  private static getFilterValue(
    entityVal: unknown,
    entity: unknown,
    filter: FetchByArtifactConfigFilterValue,
    params: Record<string, unknown>,
  ) {
    if (filter && typeof filter === 'object') {
      if (filter.coalesce) {
        for (const filterVariant of filter.coalesce) {
          const val = FetchByArtifactService.getFilterValue(
            entityVal,
            entity,
            filterVariant,
            params,
          );

          if (val != null) {
            return val;
          }
        }
      }

      if (filter.get) {
        return _.get(entityVal, filter.get);
      }

      if (filter.getRoot) {
        return _.get(entity, filter.getRoot);
      }

      if (filter.if) {
        if (FetchByArtifactService.filter(entityVal, { '...': filter.if.condition }, params)) {
          return FetchByArtifactService.getFilterValue(entityVal, entity, filter.if.then, params);
        } else if (filter.if.else) {
          return FetchByArtifactService.getFilterValue(entityVal, entity, filter.if.else, params);
        }
      }

      if (filter.param) {
        return _.get(params, filter.param);
      }

      return undefined;
    }

    return filter;
  }
}
