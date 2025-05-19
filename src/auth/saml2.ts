import express from 'express';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Autowired, err } from '../utils';
import { IAuthStrategyMethod, IAuthStrategyService } from '.';
import { IUser } from '../user';
import { StorageHolderService } from '../storages';
import { authSendData as execAuthSendData, authorizeByOneTimeToken, generateOneTimeToken, prepareAuthData } from '../auth';
import { Log } from '../logger';
import { Saml2Service } from '../services/saml2.service';

export interface ISaml2AuthStrategyServiceConfig {
  publicDomain?: string;
  paths?: {
    crt?: string;
    pem?: string;
    metadata?: string;
  };
  urls?: {
    login?: string;
    logout?: string;
    callbackUrl?: string;
  };
  extra?: {
    entityId?: string;
  };
  storage?: string;
}

@Service()
export class Saml2AuthStrategyService extends EntityService<ISaml2AuthStrategyServiceConfig> implements IAuthStrategyService {
  static readonly type: string = 'saml2';

  protected client: Saml2Service;
  @Autowired() protected storagesService: StorageHolderService;

  private get storage() {
    return this.storagesService.get(this.config?.storage ?? 'default');
  }

  // constructor(protected config?: {
  //   publicDomain?: string;
  //   paths?: {
  //     crt?: string;
  //     pem?: string;
  //     metadata?: string;
  //   };
  //   urls?: {
  //     login?: string;
  //     logout?: string;
  //     callbackUrl?: string;
  //   };
  //   extra?: {
  //     entityId?: string;
  //   };
  //   storage?: string;
  // }) {
  //   super();

  //   this.client = new Saml2Service(
  //     config?.publicDomain,
  //     config?.paths,
  //     config?.urls,
  //   );
  // }

  onConfigAfter(config: ISaml2AuthStrategyServiceConfig): ISaml2AuthStrategyServiceConfig {
    this.client = new Saml2Service(
      config?.publicDomain,
      config?.paths,
      config?.urls,
    );

    return config;
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
      const saml2AuthData = await this.client.assert(req.body);
      const saml2User = {
        id: String(saml2AuthData.id),
        type: this.type,

        // name: authData.name,
        email: saml2AuthData.email,
      }

      const user = this.config?.storage
        ? await this.storage.userGetByKeyAndType(String(saml2User.id), this.type)
          ?? (saml2User.email && await this.storage.userGet({ email: saml2User.email, type: this.type }))
          ?? null
        : saml2User;

      if (this.config?.storage && !user) {
        res.status(401);
  
        throw new Error('User not found');
      }

      const ott = generateOneTimeToken(user);

      res.redirect(`${this.config?.urls?.callbackUrl ?? `${process.env.DOMAIN || 'http://localhost:9002'}/auth/${this.id}/callback`}?code=${ott}`);
    }));

    app.get(path + '/callback', err(async (req, res) => {
      execAuthSendData(req, res, prepareAuthData(authorizeByOneTimeToken(req.query.code)));
    }));

    app.get(path + '/metadata.xml', err(async (req, res) => {
      res.send(this.client.getMetadata());
    }));

    app.get(path + '/redirect', err(async (req, res) => {
      res.redirect((await this.request()).actions.redirect);
    }));
  }
}
