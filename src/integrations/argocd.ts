import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { ArgocdService } from '../services/argocd.service';
import { AwaitedCache } from '../cache';
import {resolvePlaceholders} from '../utils';
import * as _ from 'lodash';
import {Log} from '../logger';

export interface IArgocdConfig {
  applicationName?: string;

  cacheTtlSec?: number;
  host?: string;

  username?: string;
  password?: string;

  token?: string;
}

@Service()
export class ArgocdIntegrationService extends EntityService implements IIntegrationService {
  protected cache = new AwaitedCache<unknown>();
  protected client: ArgocdService;

  static readonly type: string = 'argocd';

  constructor(public readonly config?: IArgocdConfig) {
    super();

    this.client = new ArgocdService(
      config?.host,
      config?.username,
      config?.password,
      config?.token,
    );
  }

  @Log('debug') @IncStatistics()
  async getApplication(name?) {
    if (!name) {
      name = this.config?.applicationName;
    }

    if (!name) {
      return;
    }

    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const res = await this.client.getApplication(name);

    this.cache.set(name, res, this.config?.cacheTtlSec ?? 30);

    return res;
  }

  @Log('debug') @IncStatistics()
  async syncResource(params: {
    resourceName: string | string[],
    resourceKind: string
  } | {
    resourceNameIn: string | string[],
    resourceKind: string
  }, name?) {
    if (!name) {
      name = this.config?.applicationName;
    }

    if (!name) {
      return;
    }

    const context = this.context;

    function rep(val) {
      if (Array.isArray(val)) {
        return val.map((val) => resolvePlaceholders(val, context));
      }

      return resolvePlaceholders(val, context);
    }

    if (params) {
      params = _.mapValues(params, rep);
    }

    await this.client.syncResource(rep(name), params);
  }
}
