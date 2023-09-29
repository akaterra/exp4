import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { ArgocdService } from '../services/argocd.service';

export interface IArgocdConfig {
  host?: string;
  username?: string;
  password?: string;
  applicationName?: string;
}

@Service()
export class ArgocdIntegrationService extends EntityService implements IIntegrationService {
  protected client: ArgocdService;

  static readonly type: string = 'argocd';

  constructor(public readonly config?: IArgocdConfig) {
    super();

    this.client = new ArgocdService(
      config?.host,
      config?.username,
      config?.password,
    );
  }

  @IncStatistics()
  getApplication(name?) {
    return this.client.getApplication(name ?? this.config?.applicationName);
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
