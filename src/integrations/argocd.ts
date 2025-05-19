import { IIntegrationService, IncStatistics } from '.';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Cache } from '../cache';
import { iter, request, resolvePlaceholders } from '../utils';
import * as _ from 'lodash';
import { Log } from '../logger';
import { maybeReplaceEnvVars } from './utils';
import {IValidationSchemaDef} from '../services/validator.service';

export interface IArgocdConfig {
  applicationName?: string;

  cacheTtlSec?: number;
  host: string;

  username?: string;
  password?: string;

  token?: string;
}

export interface IArgocdServiceSync {
  appNamespace: string;
  revision: string;
  prune: false;
  dryRun: false;
  strategy: {
    hook: {
      force: false;
    };
  };
  resources: unknown[];
  syncOptions: null;
}

@Service()
export class ArgocdIntegrationService extends EntityService<IArgocdConfig> implements IIntegrationService {
  protected accessToken: string = null;
  protected cache = new Cache<unknown>();

  protected _validationSchema = {
    applicationName: { type: 'string', required: true },
    cacheTtlSec: { type: 'number', required: false, constraints: { min: 0, max: 3600 } },
    host: { type: 'string', required: true, constraints: { minLength: 1 } },
    username: { type: 'string', required: false, constraints: { minLength: 1 } },
    password: { type: 'string', required: false, constraints: { minLength: 1 } },
    token: { type: 'string', required: false, constraints: { minLength: 1 } },
  }

  static readonly type: string = 'argocd';

  get isLoggedIn() {
    return !!this.accessToken;
  }

  // constructor(public readonly config: IArgocdConfig) {
  //   super();

  //   this.config = {
  //     ...this.config,
  //     host: maybeReplaceEnvVars(this.config.host) || process.env.ARGOCD_HOST,
  //     username: maybeReplaceEnvVars(this.config.username) || process.env.ARGOCD_USERNAME,
  //     password: maybeReplaceEnvVars(this.config.password) || process.env.ARGOCD_PASSWORD,
  //     token: maybeReplaceEnvVars(this.config.token) || process.env.ARGOCD_TOKEN,
  //   };

  //   setInterval(() => this.login(), 1000 * 60 * 30); // every 30 minutes
  // }

  onConfigBefore(config: IArgocdConfig): IArgocdConfig {
    return {
      ...config,
      host: maybeReplaceEnvVars(config.host) || process.env.ARGOCD_HOST,
      username: maybeReplaceEnvVars(config.username) || process.env.ARGOCD_USERNAME,
      password: maybeReplaceEnvVars(config.password) || process.env.ARGOCD_PASSWORD,
      token: maybeReplaceEnvVars(config.token) || process.env.ARGOCD_TOKEN,
    };
  }

  onConfigAfter(config: IArgocdConfig): IArgocdConfig {
    return config;
  }

  @Log('debug') @IncStatistics()
  async applicationGet(applicationName?: string) {
    if (!this.isLoggedIn) {
      await this.login();
    }

    if (!applicationName) {
      applicationName = this.config?.applicationName;
    }

    if (!applicationName) {
      return;
    }

    if (this.cache.has(applicationName)) {
      return this.cache.get(applicationName);
    }

    const res = await request(`${this.config.host}/api/v1/applications/${applicationName}`, undefined, 'get', this.accessToken);

    this.cache.set(applicationName, res, this.config?.cacheTtlSec ?? 30);

    return res;
  }

  @IncStatistics()
  async login(username?: string, password?: string) {
    this.accessToken = (await request(
      `${this.config.host}/api/v1/session`,
      {
        username: username ?? this.config.username,
        password: password ?? this.config.password,
      },
      'post',
    ))?.token;
  }

  @Log('debug') @IncStatistics()
  async sync(params: IArgocdServiceSync, applicationName?: string) {
    if (!this.isLoggedIn) {
      await this.login();
    }

    if (!applicationName) {
      applicationName = this.config?.applicationName;
    }

    if (!applicationName) {
      return;
    }

    return request(`${this.config.host}/api/v1/applications/${applicationName}/sync`, params, 'post', this.accessToken);
  }

  @Log('debug') @IncStatistics()
  async resourceSync(params: {
    resourceName: string | string[],
    resourceKind: string
  } | {
    resourceNameIn: string | string[],
    resourceKind: string
  }, applicationName?: string) {
    if (!applicationName) {
      applicationName = this.config?.applicationName;
    }

    if (!applicationName) {
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

    if (!this.isLoggedIn) {
      await this.login();
    }

    const application = await this.applicationGet(applicationName);
    const resources: unknown[] = [];

    if ('resourceName' in params) {
      for (const [ , resourceName ] of iter(params.resourceName)) {
        const resource = Array.isArray(params.resourceKind)
          ? application?.status?.resources?.find((resource) => {
            return resource.name === resourceName && params.resourceKind.includes(resource.kind);
          })
          : application?.status?.resources?.find((resource) => {
            return resource.name === resourceName && resource.kind === params.resourceKind;
          });

        if (resource) {
          resources.push(resource);
        }
      }
    } else if ('resourceNameIn' in params) {
      for (const [ , resourceNameIn ] of iter(params.resourceNameIn)) {
        const resource = Array.isArray(params.resourceKind)
          ? application?.status?.resources?.find((resource) => {
            return resourceNameIn.includes(resource.name) && params.resourceKind.includes(resource.kind);
          })
          : application?.status?.resources?.find((resource) => {
            return resourceNameIn.includes(resource.name) && resource.kind === params.resourceKind;
          });

        if (resource) {
          resources.push(resource);
        }
      }
    }

    if (!resources.length) {
      return null;
    }

    await this.sync({
      appNamespace: application.metadata.namespace,
      revision: application.spec.source.targetRevision,
      prune: false,
      dryRun: false,
      strategy: {
        hook: {
          force: false
        }
      },
      resources,
      syncOptions: null,
    }, applicationName);
  }
}
