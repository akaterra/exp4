import express from 'express';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Autowired, err, request } from '../utils';
import { IAuthStrategyMethod, IAuthStrategyService } from './auth-strategy.service';
import { IUser } from '../user';
import { StoragesService } from '../storages.service';
import { prepareAuthData } from '../auth.service';
import { Log } from '../logger';
const { compare } = require('bcrypt');

@Service()
export class PasswordAuthStrategyService extends EntityService implements IAuthStrategyService {
  static readonly type: string = 'password';

  @Autowired() protected storagesService: StoragesService;

  private get storage() {
    return this.storagesService.get(this.config?.storage ?? 'default');
  }

  constructor(protected config?: {
    saltRoutes?: number;
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
        input: [ { field: 'username' }, { field: 'password' } ],
        callbackUrl: { method: 'post' },
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

    app.post(path + '/callback', err(async (req, res) => {
      const user = await this.storage.userGet(String(req.body.username), this.type);

      if (!user || !await this.comparePassword(req.body.password, user.password)) {
        res.status(401);

        throw new Error('Unauthorized');
      }

      res.json(prepareAuthData(user));
    }));
  }

  private comparePassword(password, hash): Promise<boolean> {
    return compare(password, hash);
  }
}
