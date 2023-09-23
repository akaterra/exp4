import express from 'express';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Autowired, err, request } from '../utils';
import { IAuthStrategyMethod, IAuthStrategyService } from './auth-strategy.service';
import { IUser } from '../user';
import { StoragesService } from '../storages.service';
import { authorizeByOneTimeToken, generateOneTimeToken, prepareAuthData } from '../auth.service';
import { Log } from '../logger';
import {Saml2Service} from '../services/saml2.service';

@Service()
export class Saml2AuthStrategyService extends EntityService implements IAuthStrategyService {
  static readonly type: string = 'saml2';

  protected client: Saml2Service;
  @Autowired() protected storagesService: StoragesService;

  private get storage() {
    return this.storagesService.get(this.config?.storage ?? 'default');
  }

  constructor(protected config?: {
    publicDomain?: string;
    paths?: {
      crt?: string;
      pem?: string;
      metadata?: string;
    };
    urls?: {
      login?: string;
      logout?: string;
      ui?: string;
    };
    extra?: {
      entityId?: string;
    };
    storage?: string;
  }) {
    super();

    this.client = new Saml2Service(
      config?.publicDomain,
      config?.paths,
      config?.urls,
    );
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
        redirect: await this.client.getLoginUrl(),
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

    app.post(path + '/acs', err(async (req, res) => {
      const authData = await this.client.assert(req.body);
      const user = {
        id: String(authData.id),
        type: this.type,

        // name: authData.name,
        email: authData.email,
      }
      const ott = generateOneTimeToken(user);

      res.redirect(`${this.config?.urls?.ui ?? 'http://localhost:9002/auth/saml2/callback'}?code=${ott}`);
    }));

    app.get(path + '/callback', err(async (req, res) => {
      res.json(prepareAuthData(authorizeByOneTimeToken(req.query.code)));
    }));

    app.get(path + '/metadata.xml', err(async (req, res) => {
      res.send(this.client.getMetadata());
    }));

    app.get(path + '/redirect', err(async (req, res) => {
      res.redirect((await this.request()).actions.redirect);
    }));
  }
}
