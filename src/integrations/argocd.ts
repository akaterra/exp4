import { Octokit } from '@octokit/rest';
import { IIntegrationService } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import fetch from 'node-fetch-native';
import {ArgocdService} from '../services/argocd.service';

export interface IArgocdConfig {
  domain?: string;
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
      config?.domain,
      config?.username,
      config?.password,
    );
  }

  getApplication(name?) {
    return this.client.getApplication(name ?? this.config?.applicationName);
  }
}