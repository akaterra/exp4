import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { ArgocdService } from '../services/argocd.service';
import { AwaitedCache } from '../cache';

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

  @IncStatistics()
  async getApplication(name?) {
    if (!name) {
      name = this.config?.applicationName;
    }

    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const res = await this.client.getApplication(name);

    this.cache.set(name, res, this.config?.cacheTtlSec ?? 30);

    return res;
  }

  @IncStatistics()
  async syncResource(params: {
    resourceName: string | string[],
    resourceKind: string
  } | {
    resourceNameIn: string | string[],
    resourceKind: string
  }, name?) {
    await this.client.syncResource(
      name ?? this.config?.applicationName,
      params,
    );
  }
}
