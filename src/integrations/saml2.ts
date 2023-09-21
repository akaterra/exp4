import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { ArgocdService } from '../services/argocd.service';
import {Saml2Service} from '../services/saml2.service';

export interface ISaml2Config {
  publicDomain?: string;
  paths?: {
    crt?: string;
    pem?: string;
    metadata?: string;
  };
  urls?: {
    login?: string;
    logout?: string;
  };
}

@Service()
export class Saml2IntegrationService extends EntityService implements IIntegrationService {
  protected client: Saml2Service;

  static readonly type: string = 'saml2';

  constructor(public readonly config?: ISaml2Config) {
    super();

    this.client = new Saml2Service(
      config?.publicDomain,
      config?.paths,
      config?.urls,
    );
  }

  @IncStatistics()
  getLoginUrl() {
    return this.client.getLoginUrl();
  }

  @IncStatistics()
  assert(assertion: string) {
    return this.client.assert(assertion);
  }
}
