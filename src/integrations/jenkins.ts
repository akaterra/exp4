import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { AwaitedCache } from '../cache';
import { JenkinsService } from '../services/jenkins.service';

export interface IJenkinsConfig {
  cacheTtlSec?: number;

  buildName?: string;
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
      config?.host,
      config?.username,
      config?.password,
      config?.token,
    );
  }

  @IncStatistics()
  async getJobHistory(name?) {
    if (!name) {
      name = this.config?.buildName;
    }

    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const res = await this.client.getJobHistory(name);

    this.cache.set(name, res, this.config?.cacheTtlSec ?? 30);

    return res;
  }

  @IncStatistics()
  async runJob(name?, params?: Record<string, unknown>) {
    
  }
}
