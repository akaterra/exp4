import { flow, makeObservable, observable } from 'mobx';
import { IUser } from './dto/user';
import { UsersService } from '../services/users.service';
import { IAuthStrategyMethod } from './dto/auth';
import { processing } from './utils';
import { RestApiService } from '../services/rest-api.service';
import { ProjectsStore } from './projects';
import { StatisticsStore } from './statistics';
import { IProject } from './dto/project';
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
    authPassword: string | null = null;
  @observable
    authUsername: string | null = null;
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
  *authenticate(id?: IAuthStrategyMethod['id']) {
    if (!id) {
      id = 'github';
    }

    yield this.fetchAuthMethodActions(id);

    if (this.authMethods[id]?.actions?.redirect) {
      window.location.href = this.authMethods[id]?.actions.redirect;
    }
  }

  @flow @processing
  *authenticateByUsernamePassword(id?: IAuthStrategyMethod['id']) {
    if (!id) {
      id = 'password';
    }

    yield this.fetchAuthMethodActions(id);

    // if (this.authMethods[id]?.actions?.redirect) {
    //   window.location.href = this.authMethods[id]?.actions.redirect;
    // }
  }

  @flow @processing
  *authorize(id?: string) {
    this.authMethods = yield this.usersService.listAuthMethods();
    this.accessToken = RestApiService.accessToken = localStorage.getItem('accessToken');

    if (this.accessToken && !id) {
      const user = yield this.usersService.getCurrent();

      if (user) {
        this.user = user;
      }

      this.isAuthorized = true;
    } else if (id) {
      this.isAuthorized = false;

      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');

      if (code) {
        const { accessToken, user } = yield this.usersService.authorize(id, code);

        localStorage.setItem('accessToken', accessToken);

        this.accessToken = RestApiService.accessToken = accessToken;
        this.isAuthorized = true;
        this.user = user;

        yield this.start(':first');
      } else {
        yield this.fetchAuthMethodActions(id);

        this.isAuthorized = false;
      }
    } else {
      this.isAuthorized = false;
    }
  }

  @flow @processing
  *fetchAuthMethodActions(id?: IAuthStrategyMethod['id']): IAuthStrategyMethod['actions'] {
    if (!id) {
      id = 'github';
    }

    const authMethod = this.authMethods[id];

    if (authMethod) {
      this.authMethods[id] = { ...authMethod, ...yield this.usersService.listAuthMethodActions(id) };

      yield this.authMethods[id].actions;
    } else {
      yield null;      
    }
  }

  @flow @processing
  *logout() {
    localStorage.removeItem('accessToken');

    this.accessToken = null;
    this.isAuthorized = false;

    yield this.authorize();
  }

  @flow @processing
  *start(selectedProjectId?: IProject['id'] | ':first') {
    yield this.authorize();

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
