import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { AwaitedCache } from '../cache';
import { JenkinsService } from '../services/jenkins.service';
import { resolvePlaceholders } from '../utils';
import * as _ from 'lodash';
import { Log } from '../logger';
import { maybeReplaceEnvVars } from './utils';

export interface IJenkinsConfig {
  cacheTtlSec?: number;

  jobName?: string;
  jobParams?: Record<string, unknown>;
  host?: string;

  username?: string;
  password?: string;

  token?: string;
}

@Service()
export class JenkinsIntegrationService extends EntityService implements IIntegrationService {
  protected cache = new AwaitedCache<unknown>();
  protected client: JenkinsService;

  static readonly type: string = 'jenkins';

  constructor(public readonly config?: IJenkinsConfig) {
    super();

    this.client = new JenkinsService(
      maybeReplaceEnvVars(config?.host),
      maybeReplaceEnvVars(config?.username),
      maybeReplaceEnvVars(config?.password),
      maybeReplaceEnvVars(config?.token),
    );
  }

  @Log('debug') @IncStatistics()
  async getJobHistory(name?) {
    if (!name) {
      name = this.config?.jobName;
    }

    if (!name) {
      return null;
    }

    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const res = await this.client.getJobHistory(name);

    this.cache.set(name, res, this.config?.cacheTtlSec ?? 30);

    return res;
  }

  @Log('debug') @IncStatistics()
  async runJob(name?, params?: Record<string, unknown>) {
    if (!name) {
      name = this.config?.jobName;
    }

    if (!name) {
      return null;
    }

    const context = this.context;

    function rep(val) {
      if (Array.isArray(val)) {
        return val.map((val) => resolvePlaceholders(val, context));
      }

      return resolvePlaceholders(val, context);
    }

    params = { ...this.config?.jobParams, ...params };

    if (!Object.keys(params).length) {
      params = null;
    }

    if (params) {
      params = _.mapValues(params, rep);
    }

    await this.client.runJob(resolvePlaceholders(name, context), params);
  }
}
