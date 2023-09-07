import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact } from '../project';
import { IStream } from '../stream';
import { EntityService } from '../entities.service';
import * as _ from 'lodash';
import { iter } from '../utils';

export interface FetchByArtifactConfigFilter {
  complex?: Record<string, FetchByArtifactConfigFilter>;
  contains?: any;
  eq?: any;
  gte?: any;
  in?: any;
  lte?: any;
  ne?: any;
  notEmpty?: boolean;
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
    entity: any,
    filter: Record<string, FetchByArtifactConfigFilter>,
    params: Record<string, any>,
  ) {
    for (const [ key, condition ] of Object.entries(filter)) {
      const val = key !== '...' ? _.get(entity, key) : entity;

      if (condition.notEmpty && (val == null || val === '')) {
        return false;
      }

      if (condition.complex) {
        if (!FetchByArtifactService.filter(
          val,
          condition.complex,
          params,
        )) {
          return false;
        }
      }

      if (condition.contains && !val?.includes(FetchByArtifactService.getFilterValue(
        condition.contains,
        params,
      ))) {
        return false;
      }

      if (condition.eq !== undefined && val !== FetchByArtifactService.getFilterValue(
        condition.eq,
        params,
      )) {
        return false;
      }

      if (condition.gte !== undefined && val <= FetchByArtifactService.getFilterValue(
        condition.gte,
        params,
      )) {
        return false;
      }

      if (condition.in && !FetchByArtifactService.getFilterValue(
        condition.in,
        params,
      )?.includes(val)) {
        return false;
      }

      if (condition.lte !== undefined && val >= FetchByArtifactService.getFilterValue(
        condition.lte,
        params,
      )) {
        return false;
      }

      if (condition.ne !== undefined && val === FetchByArtifactService.getFilterValue(
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

  private static getFilterValue(filter, params) {
    if (filter && typeof filter === 'object') {
      if (filter.key) {
        return _.get(params, filter.key);
      }

      return undefined;
    }

    return filter;
  }
}
