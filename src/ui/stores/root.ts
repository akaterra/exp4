import { flow, makeObservable, observable } from 'mobx';
import { IUser } from './dto/user';
import { UsersService } from '../services/users.service';
import { IAuthStrategyMethod } from './dto/auth';
import { processing } from './utils';
import { RestApiService } from '../services/rest-api.service';
import { ProjectsStore } from './projects';
import { StatisticsStore } from './statistics';
import {IProject} from './dto/project';
import { Router } from '@remix-run/router/router';

export class RootStore {
  private isReadyResolve: () => any;
  private router: Router;

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

  setRouter(router: Router) {
    this.router = router;

    return this;
  }

  @flow @processing
  *authenticate(id?: string) {
    this.authMethods = yield this.usersService.listAuthMethods();
    this.accessToken = RestApiService.accessToken = localStorage.getItem('accessToken');

    if (this.accessToken && !id) {
      const user = yield this.usersService.getCurrent();

      if (user) {
        this.user = user;
      }

      this.isAuthorized = true;
    } else {
      this.isAuthorized = false;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        const { accessToken, user } = yield this.usersService.authorize(id ?? 'github', code);

        localStorage.setItem('accessToken', accessToken);

        this.accessToken = RestApiService.accessToken = accessToken;
        this.isAuthorized = true;
        this.user = user;

        yield this.start(':first');
      } else {
        yield this.fetchAuthMethodActions(id ?? 'github');
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
  *start(selectedProjectId?: IProject['id'] | ':first') {
    yield this.authenticate();

    if (this.isAuthorized) {
      yield this.projectsStore.fetch();
    }

    this.isReadyResolve();

    if (this.isAuthorized) {
      if (selectedProjectId) {
        if (selectedProjectId === ':first') {
          this.navigate(`/projects/${Object.values(this.projectsStore.projects)?.[0]?.id}`);
        } else if (this.projectsStore.projects[selectedProjectId]) {
          this.navigate(`/projects/${selectedProjectId}`);
        }
      }
    }
  }

  navigate(path) {
    if (this.router) {
      this.router.navigate(path);
    }
  }
}

export const rootStore = new RootStore();
