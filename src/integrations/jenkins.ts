import { IIntegrationService, IncStatistics } from '.';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Cache } from '../cache';
import { resolvePlaceholders } from '../utils';
import * as _ from 'lodash';
import { Log } from '../logger';
import { maybeReplaceEnvVars } from './utils';
import { rest } from '../services/rest-api.service';

export interface IJenkinsConfig {
  cacheTtlSec?: number;

  jobName?: string;
  jobParams?: Record<string, unknown>;
  host: string;

  username?: string;
  password?: string;

  token?: string;
}

@Service()
export class JenkinsIntegrationService extends EntityService<IJenkinsConfig> implements IIntegrationService {
  protected cache = new Cache<unknown>();
  protected hostUrl: URL;

  static readonly type: string = 'jenkins';

  // constructor(public readonly config: IJenkinsConfig) {
  //   super();

  //   this.config = {
  //     ...this.config,
  //     host: maybeReplaceEnvVars(this.config.host) || process.env.JENKINS_HOST,
  //     username: maybeReplaceEnvVars(this.config.username) || process.env.JENKINS_USERNAME,
  //     password: maybeReplaceEnvVars(this.config.password) || process.env.JENKINS_PASSWORD,
  //     token: maybeReplaceEnvVars(this.config.token) || process.env.JENKINS_TOKEN,
  //   };
  //   this.hostUrl = new URL(this.config.host);
  // }

  onConfigBefore(config: IJenkinsConfig): IJenkinsConfig {
    return {
      ...config,
      host: maybeReplaceEnvVars(config.host) || process.env.JENKINS_HOST,
      username: maybeReplaceEnvVars(config.username) || process.env.JENKINS_USERNAME,
      password: maybeReplaceEnvVars(config.password) || process.env.JENKINS_PASSWORD,
      token: maybeReplaceEnvVars(config.token) || process.env.JENKINS_TOKEN,
    };
  }

  onConfigAfter(config: IJenkinsConfig): IJenkinsConfig {
    this.hostUrl = new URL(this.config.host);

    return config;
  }

  @Log('debug') @IncStatistics()
  async jobHistoryGet(name?) {
    if (!name) {
      name = this.config?.jobName;
    }

    if (!name) {
      return null;
    }

    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    let res = await rest.withHeaders({
      Authorization: this.getAuthHeader(),
    }).doRequest(
      this.getUrl(`/job/${name}/api/json?tree=allBuilds[id,timestamp,result,duration]`),
      'get',
    );

    if (!res) {
      return null;
    }

    let promises = [];

    for (const run of res) {
      promises.push(rest.withHeaders({
        Authorization: this.getAuthHeader(),
      }).doRequest(
        this.getUrl(`/job/${name}/${run.id}/api/json`),
        'get',
      ).then((res) => run.details = res));

      if (promises.length >= 10) {
        await Promise.all(promises);
        promises = [];
      }
    }

    res = await Promise.all(promises);

    this.cache.set(name, res, this.config?.cacheTtlSec ?? 30);

    return res;
  }

  @Log('debug') @IncStatistics()
  async jobRun(name?, params?: Record<string, unknown>) {
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
    
    name = resolvePlaceholders(name, context);

    await rest.withFormat('text').withHeaders({
      Authorization: this.getAuthHeader(),
    }).doRequest(
      params
        ? this.getUrl(`/job/${name}/buildWithParameters`)
        : this.getUrl(`/job/${name}/build/api/json`),
      'post',
      undefined,
      params,
    );
  }

  private getAuthHeader(): string {
    if (this.config.username && this.config.token) {
      return `Basic ${btoa(encodeURIComponent(this.config.username) + ':' + this.config.token)}`;
    }

    if (this.config.username && this.config.password) {
      return `Basic ${btoa(encodeURIComponent(this.config.username) + ':' + encodeURIComponent(this.config.password))}`;
    }

    return '';
  }

  private getUrl(path: string): string {
    if (this.config.username && this.config.token) {
      return `${this.hostUrl.protocol}//${this.hostUrl.host}:${this.hostUrl.port}${path}`;
    }

    if (this.config.username && this.config.password) {
      return `${this.hostUrl.protocol}//${this.hostUrl.host}:${this.hostUrl.port}${path}`;
    }

    return `${this.config.host}${path}`;
  }
}
