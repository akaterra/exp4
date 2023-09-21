import express from 'express';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Autowired, err, request } from '../utils';
import { IntegrationsService } from '../integrations.service';
import { GithubIntegrationService } from '../integrations/github';
import { IAuthStrategyMethod, IAuthStrategyService } from './auth-strategy.service';
import { IUser } from '../user';
import { StoragesService } from '../storages.service';
import { prepareAuthData } from '../auth.service';
import { Log } from '../logger';
import {Saml2IntegrationService} from '../integrations/saml2';

@Service()
export class Saml2AuthStrategyService extends EntityService implements IAuthStrategyService {
  static readonly type: string = 'saml2';

  @Autowired() protected integrationsService: IntegrationsService;
  @Autowired() protected storagesService: StoragesService;

  private get integration() {
    return this.integrationsService.get(this.config?.integration ?? 'default', this.type) as Saml2IntegrationService;
  }

  private get storage() {
    return this.storagesService.get(this.config?.storage ?? 'default');
  }

  constructor(protected config?: {
    integration?: string;
    storage?: string;
  }) {
    super();
  }

  @Log('debug')
  async authorize(data: Record<string, any>): Promise<IUser> { // eslint-disable-line
    return null;
  }

  @Log('debug')
  async request(): Promise<IAuthStrategyMethod> {
    return {
      id: this.id,
      type: this.type,
      actions: {
        redirect: await this.integration.getLoginUrl(),
      },
    };
  }

  @Log('debug')
  async configureServer(app: express.Application, path?: string): Promise<void> {
    if (!path) {
      path = `/auth/methods/${this.id ?? this.type}`;
    } else {
      path = `/auth/methods${path}`;
    }

    app.get(path, err(async (req, res) => {
      res.json(await this.request());
    }));

    app.get(path + '/redirect', async (req, res) => {
      res.redirect((await this.request()).actions.redirect);
    });
  }
}
