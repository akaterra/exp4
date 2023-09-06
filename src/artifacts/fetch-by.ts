import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import {EntityService} from '../entities.service';
import * as _ from 'lodash';
import {iter} from '../utils';

export interface FetchByArtifactConfigFilter {
  complex?: Record<string, FetchByArtifactConfigFilter>;
  contains?: any;
  gte?: any;
  in?: any;
  lte?: any;
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
  filter?: FetchByArtifactConfigFilter;
  filterPath?: string;
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
            defConfig.filterPath ? _.get(val, defConfig.filterPath) : val,
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
    val: any,
    filter: FetchByArtifactConfigFilter,
    params: Record<string, any>,
  ) {
    if (filter.notEmpty && (val == null || val === '')) {
      return false;
    }

    if (filter.complex) {
      for (const [ complexKey, complexFilter ] of Object.entries(filter.complex)) {
        if (!FetchByArtifactService.filter(
          _.get(val, complexKey),
          complexFilter,
          params,
        )) {
          return false;
        }
      }

      return true;
    }

    if (filter.contains && !val.includes(FetchByArtifactService.getFilterValue(
      filter.contains,
      params,
    ))) {
      return false;
    }

    if (filter.gte !== undefined && val <= FetchByArtifactService.getFilterValue(
      filter.gte,
      params,
    )) {
      return false;
    }

    if (filter.in && !FetchByArtifactService.getFilterValue(
      filter.in,
      params,
    )?.includes(val)) {
      return false;
    }

    if (filter.lte !== undefined && val >= FetchByArtifactService.getFilterValue(
      filter.lte,
      params,
    )) {
      return false;
    }

    if (filter.pattern && typeof val === 'string') {
      if (!(filter.pattern instanceof RegExp)) {
        filter.pattern = new RegExp(filter.pattern);
      }

      if (!(filter.pattern as RegExp).test(val)) {
        return false;
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
