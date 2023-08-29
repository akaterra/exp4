import { computed, flow, makeObservable, observable } from 'mobx';
import { IUser } from './dto/user';
import { UsersService } from '../services/users.service';
import { IAuthStrategyMethod } from './dto/auth';
import { processing } from './utils';

export class RootStore {
  readonly usersService = new UsersService();

  @observable
  authMethods: Record<string, IAuthStrategyMethod> = {};
  @observable
  isAuthorized: boolean = false;
  @observable
  user: IUser | null = null;

  accessToken: string | null = null;

  constructor() {
    makeObservable(this);

    this.authenticate();
  }

  @flow @processing
  *authenticate() {
    this.authMethods = yield this.usersService.listAuthMethods();
    this.accessToken = localStorage.getItem('accessToken');

    if (this.accessToken) {
      this.isAuthorized = true;
    } else {
      this.isAuthorized = false;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        const { accessToken } = yield this.usersService.authorize('github', code);

        if (accessToken) {
          localStorage.setItem('accessToken', accessToken);

          this.accessToken = accessToken;
          this.isAuthorized = true;
        }
      } else {
        yield this.fetchAuthMethodActions('github');
      }
    }
  }

  @flow @processing
  *logout() {
    localStorage.removeItem('accessToken');

    this.accessToken = null;
    this.isAuthorized = false;

    yield this.authenticate();
  }

  @flow @processing
  *fetchAuthMethodActions(id: IAuthStrategyMethod['id']): IAuthStrategyMethod['actions'] {
    const authMethod = this.authMethods[id];

    if (authMethod) {
      this.authMethods[id] = { ...authMethod, ...yield this.usersService.listAuthMethodActions(id) };

      return authMethod.actions;
    }

    return null;
  }
}

export const rootStore = new RootStore();
