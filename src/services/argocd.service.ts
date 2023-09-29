import {Log} from '../logger';
import { iter, request } from '../utils';

export interface IArgocdServiceSync {
  appNamespace: string;
  revision: string;
  prune: false;
  dryRun: false;
  strategy: {
      hook: {
          force: false;
      };
  };
  resources: unknown[];
  syncOptions: null;
}

export class ArgocdService {
  private accessToken: string = null;

  get isLoggedIn() {
    return !!this.accessToken;
  }

  constructor(
    private host: string = process.env.ARGOCD_HOST,
    private username: string = process.env.ARGOCD_USERNAME,
    private password: string = process.env.ARGOCD_PASSWORD,
  ) {
  }

  @Log('debug')
  async getApplication(applicationName: string) {
    if (!this.isLoggedIn) {
      await this.login();
    }

    return request(`${this.host}/api/v1/applications/${applicationName}`, undefined, 'get', this.accessToken);
  }

  async login(username?: string, password?: string) {
    this.accessToken = (await request(
      `${this.host}/api/v1/session`,
      {
        username: username ?? this.username,
        password: password ?? this.password,
      },
      'post',
    ))?.token;
  }

  @Log('debug')
  async sync(applicationName: string, params: IArgocdServiceSync) {
    if (!this.isLoggedIn) {
      await this.login();
    }

    return request(`${this.host}/api/v1/applications/${applicationName}/sync`, params, 'post', this.accessToken);
  }

  @Log('debug')
  async syncResource(applicationName: string, params: {
    resourceName: string | string[],
    resourceKind: string
  } | {
    resourceNameIn: string | string[],
    resourceKind: string
  }) {
    if (!this.isLoggedIn) {
      await this.login();
    }

    const application = await this.getApplication(applicationName);
    const resources: unknown[] = [];

    if ('resourceName' in params) {
      for (const [ , resourceName ] of iter(params.resourceName)) {
        const resource = Array.isArray(params.resourceKind)
          ? application?.status?.resources?.find((resource) => {
            return resource.name === resourceName && params.resourceKind.includes(resource.kind);
          })
          : application?.status?.resources?.find((resource) => {
            return resource.name === resourceName && resource.kind === params.resourceKind;
          });

        if (resource) {
          resources.push(resource);
        }
      }
    } else if ('resourceNameIn' in params) {
      for (const [ , resourceNameIn ] of iter(params.resourceNameIn)) {
        const resource = Array.isArray(params.resourceKind)
          ? application?.status?.resources?.find((resource) => {
            return resourceNameIn.includes(resource.name) && params.resourceKind.includes(resource.kind);
          })
          : application?.status?.resources?.find((resource) => {
            return resourceNameIn.includes(resource.name) && resource.kind === params.resourceKind;
          });

        if (resource) {
          resources.push(resource);
        }
      }
    }

    if (!resources.length) {
      return null;
    }

    return this.sync(applicationName, {
      appNamespace: application.metadata.namespace,
      revision: application.spec.source.targetRevision,
      prune: false,
      dryRun: false,
      strategy: {
          hook: {
              force: false
          }
      },
      resources,
      syncOptions: null,
    });
  }
}
