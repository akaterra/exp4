import { Service } from 'typedi';
import { IArtifactService } from '.';
import { IProjectArtifact } from '../project';
import { IStreamStateContext, StreamState } from '../stream';
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
  switch?: {
    condition: Record<string, FetchByArtifactConfigFilter>;
    then: FetchByArtifactConfigFilterValue;
  }[];
  trim?: { value: FetchByArtifactConfigFilterValue, symbol?: string };
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
    entity: { ref: IProjectArtifact['ref'], context?: IStreamStateContext },
    streamState: StreamState,
    params?: Record<string, unknown>,
  ): Promise<void> {
    if (!this.config) {
      return;
    }

    for (const [ defId, defConfig ] of Object.entries(this.config)) {
      if (!defConfig.keys?.length) {
        continue;
      }

      for (const [ , source ] of iter(
        _.get(entity.context, defConfig.source),
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
              const artifact = {
                id: artifactId,
                type: artifactType,
                author: null,
                description: artifactVal,
                link: null,
                metadata: {},
                steps: null,
                time: null,
              };

              streamState.pushArtifactUniq(artifact);

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

      if (condition.contains && !checkContains(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.contains,
        params,
      ), val)) {
        return false;
      }

      if (condition.eq !== undefined && !checkEq(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.eq,
        params,
      ), val)) {
        return false;
      }

      if (condition.gte !== undefined && !checkGte(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.gte,
        params,
      ), val)) {
        return false;
      }

      if (condition.in && !checkIn(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.in,
        params,
      ), val)) {
        return false;
      }

      if (condition.lte !== undefined && !checkLte(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.lte,
        params,
      ), val)) {
        return false;
      }

      if (condition.ne !== undefined && checkEq(FetchByArtifactService.getFilterValue(
        val,
        entity,
        condition.ne,
        params,
      ), val)) {
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

      if (filter.switch) {
        for (const { condition, then } of filter.switch) {
          if (FetchByArtifactService.filter(entityVal, { '...': condition }, params)) {
            return FetchByArtifactService.getFilterValue(entityVal, entity, then, params);
          }
        }
      }

      if (filter.trim) {
        const val = FetchByArtifactService.getFilterValue(entityVal, entity, filter.trim.value, params);

        if (typeof val === 'string') {
          return val.trim();
        }

        return val;
      }

      return undefined;
    }

    return filter;
  }
}

function checkContains(condition, val) {
  if (Array.isArray(condition)) {
    return condition.some((condition) => checkContains(condition, val));
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      if (item?.includes(condition)) {
        return true;
      }
    }
  } else if (val?.includes(condition)) {
    return true;
  }

  return false;
}


function checkEq(condition, val) {
  if (Array.isArray(condition)) {
    return condition.some((condition) => checkEq(condition, val));
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      if (condition === item) {
        return true;
      }
    }
  } else if (condition === val) {
    return true;
  }

  return false;
}

function checkGte(condition, val) {
  if (Array.isArray(condition)) {
    return condition.some((condition) => checkGte(condition, val));
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      if (condition <= val) {
        return true;
      }
    }
  } else if (condition <= val) {
    return true;
  }

  return false;
}

function checkIn(condition, val) {
  if (Array.isArray(val)) {
    return val.some((condition) => checkIn(condition, val));
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      if (condition?.includes(item)) {
        return true;
      }
    }
  } else if (condition?.includes(val)) {
    return true;
  }

  return false;
}

function checkLte(condition, val) {
  if (Array.isArray(condition)) {
    return condition.some((condition) => checkLte(condition, val));
  }

  if (Array.isArray(val)) {
    for (const item of val) {
      if (condition >= val) {
        return true;
      }
    }
  } else if (condition >= val) {
    return true;
  }

  return false;
}
