import { flow, makeObservable, observable } from 'mobx';
import { IUser } from './dto/user';
import { UsersService } from '../services/users.service';
import { IAuthStrategyMethod } from './dto/auth';
import { processing } from './utils';
import { RestApiService } from '../services/rest-api.service';
import { ProjectsStore } from './projects';
import { StatisticsStore } from './statistics';

export class RootStore {
  private isReadyResolve: () => any;

  readonly projectsStore = new ProjectsStore();
  readonly statisticsStore = new StatisticsStore();
  readonly usersService = new UsersService();

  @observable
    authMethods: Record<string, IAuthStrategyMethod> = {};
  @observable
    isAuthorized: boolean | null = null;
  @observable
    user: IUser | null = null;

  accessToken: string | null = null;
  isReady: Promise<void>;

  constructor() {
    makeObservable(this);

    this.isReady = new Promise((resolve) => {
      this.isReadyResolve = resolve;
    });

    setInterval(function (this: RootStore) {
      if (this.isAuthorized) {
        // this.projectsStore.fetch();
        // this.statisticsStore.fetch();
      }
    }.bind(this), 30000);
  }

  @flow @processing
  *authenticate() {
    this.authMethods = yield this.usersService.listAuthMethods();
    this.accessToken = RestApiService.accessToken = localStorage.getItem('accessToken');

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

          this.accessToken = RestApiService.accessToken = accessToken;
          this.isAuthorized = true;
        }
      } else {
        yield this.fetchAuthMethodActions('github');
      }
    }
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

  @flow @processing
  *logout() {
    localStorage.removeItem('accessToken');

    this.accessToken = null;
    this.isAuthorized = false;

    yield this.authenticate();
  }

  @flow @processing
  *start() {
    yield this.authenticate();

    if (this.isAuthorized) {
      yield this.projectsStore.fetch();
    }

    this.isReadyResolve();
  }
}

export const rootStore = new RootStore();
