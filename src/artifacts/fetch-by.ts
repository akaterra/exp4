import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import {EntityService} from '../entities.service';
import * as _ from 'lodash';
import {iter} from '../utils';

export type FetchByArtifactConfig = Record<string, {
  keys: ({ index: string, title: string, type: string } | number | string)[];
  filter?: {
    contain?: any;
    gte?: any;
    in?: any;
    lte?: any;
    pattern?: RegExp | string;
  };
  pattern: RegExp | string;
  source: string;
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
        defConfig.filter ? (val) => FetchByArtifactService.filter(val, defConfig.filter, params) : undefined,
      )) {
        let matches = source;

        if (typeof source === 'string') {
          if (!(defConfig.pattern instanceof RegExp)) {
            defConfig.pattern = new RegExp(defConfig.pattern);
          }

          matches = (defConfig.pattern as RegExp).exec(source);
        }

        if (matches !== undefined) {
          for (const key of defConfig.keys) {
            if (typeof key === 'number' || typeof key === 'string') {
              const match = typeof matches === 'object'
                ? matches?.[key]
                : matches;

              if (match !== undefined) {
                streamState.history.artifact.push({
                  id: typeof key !== 'string' ? defId : key,
                  type: defConfig.type ?? defId,
                  author: null,
                  description: match,
                  link: null,
                  metadata: { [ typeof key !== 'string' ? defId : key ]: match },
                  steps: null,
                  time: null,
                });
              }
            } else {
              const match = typeof matches === 'object'
                ? matches?.[key.index]
                : matches;

              if (match !== undefined) {
                streamState.history.artifact.push({
                  id: key.title,
                  type: key.type ?? defConfig.type ?? defId,
                  author: null,
                  description: match,
                  link: null,
                  metadata: { [ key.title ]: match },
                  steps: null,
                  time: null,
                });
              }
            }
          }
        }
      }
    }
  }

  private static filter(val: any, filter: {
    contain?: any;
    gte?: any;
    in?: any;
    lte?: any;
    pattern?: RegExp | string;
  }, params: Record<string, any>) {
    if (filter.contain && !val.includes(FetchByArtifactService.getFilterValue(
      filter.contain,
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
