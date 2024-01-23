import express from 'express';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Autowired, err, request } from '../utils';
import { IAuthStrategyMethod, IAuthStrategyService } from './auth-strategy.service';
import { IUser } from '../user';
import { StoragesService } from '../storages.service';
import { authSendData as execAuthSendData, prepareAuthData } from '../auth.service';
import { Log } from '../logger';

@Service()
export class GithubAuthStrategyService extends EntityService implements IAuthStrategyService {
  static readonly type: string = 'github';

  @Autowired() protected storagesService: StoragesService;

  private get storage() {
    return this.storagesService.get(this.config?.storage ?? 'default');
  }

  constructor(protected config?: {
    credentials?: {
      clientId?: string;
      clientSecret?: string;
      callbackUrl?: string;
    };
    storage?: string;
  }) {
    super();

    if (config) {
      if (!this.config.credentials) {
        this.config.credentials = {};
      }

      if (!this.config.credentials.clientId) {
        this.config.credentials.clientId = process.env.GITHUB_CLIENT_ID;
      }

      if (!this.config.credentials.clientSecret) {
        this.config.credentials.clientSecret = process.env.GITHUB_CLIENT_SECRET;
      }

      if (!this.config.credentials.callbackUrl) {
        this.config.credentials.callbackUrl = process.env.GITHUB_CALLBACK_URL;
      }
    }
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
        redirect: `https://github.com/login/oauth/authorize?client_id=${this.config?.credentials?.clientId}&client_secret=${this.config?.credentials?.clientSecret}&redirect_uri=${encodeURIComponent(this.getRedirectUri())}`,
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

    app.get(path + '/redirect', err(async (req, res) => {
      res.redirect((await this.request()).actions.redirect);
    }));

    app.get(path + '/callback', err(async (req, res) => {
      const githubAuth = await request(
        'https://github.com/login/oauth/access_token',
        {
          client_id: this.config?.credentials?.clientId,
          client_secret: this.config?.credentials?.clientSecret,
          code: req.query.code,
          redirect_uri: this.getRedirectUri(),
        },
        'post',
      );
      const githubUser = await request(
        'https://api.github.com/user',
        undefined,
        'get',
        githubAuth.access_token,
      );

      const user = this.config?.storage
        ? await this.storage.userGetById(String(githubUser.id), this.type)
          ?? (githubUser.email && await this.storage.userGet({ email: githubUser.email, type: this.type }))
          ?? (githubUser.login && await this.storage.userGet({ login: githubUser.login, type: this.type }))
          ?? null
        : {
          id: String(githubUser.id),
          type: this.type,
  
          // name: authData.name,
          email: githubUser.email,
        };

      if (this.config?.storage && !user) {
        res.status(401);

        throw new Error('User not found');
      }

      execAuthSendData(req, res, prepareAuthData(user));
    }));
  }

  private getRedirectUri() {
    return this.config?.credentials?.callbackUrl || `${process.env.DOMAIN || 'http://localhost:9002'}/auth/${this.id}/callback`;
  }
}
