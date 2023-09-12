import { requestJson } from '../utils';

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

  async getApplication(name: string) {
    if (!this.isLoggedIn) {
      await this.login();
    }

    return requestJson(`${this.host}/api/v1/applications/${name}`, undefined, 'get', this.accessToken);
  }

  async login(username?: string, password?: string) {
    this.accessToken = (await requestJson(
      `${this.host}/api/v1/session`,
      {
        username: username ?? this.username,
        password: password ?? this.password,
      },
      'post',
    ))?.token;
  }
}
