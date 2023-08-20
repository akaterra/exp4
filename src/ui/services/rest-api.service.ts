export class PublicRestApiService {
  constructor(
    private domain = 'http://127.0.0.1:7000',
    private rootPath = 'api',
  ) {
  }

  delete(path: string) {
      return this.doRequest(path, 'delete');
  }

  get(path: string) {
      return this.doRequest(path, 'get');
  }

  post(path: string, data?: any) {
      return this.doRequest(path, 'post', data);
  }

  put(path: string, data?: any) {
      return this.doRequest(path, 'put', data);
  }

  protected doRequest(path: string, method: 'delete' | 'get' | 'post' | 'put', data?) {
      const headers = this.doRequestHeaders();

      if (data !== undefined) {
          headers['Content-Type'] = 'application/json';

          return fetch(`${this.domain}/api/${path}`, {
              method,
              body: JSON.stringify(data),
              headers,
          }).then((res) => res.json());
      }

      return fetch(`${this.domain}/${this.rootPath}/${path}`, { method, headers }).then((res) => res.json());
  }

  protected doRequestHeaders() {
      const headers: any = {
          // 'Accept': '*',
      };

      return headers;
  }
}

export class RestApiService extends PublicRestApiService {
  static accessToken: string;
  static refreshToken: string;

  static configure(accessToken, refreshToken) {
      RestApiService.accessToken = accessToken;
      RestApiService.refreshToken = refreshToken;
  }

  protected doRequestHeaders() {
      const headers: any = super.doRequestHeaders();

      if (RestApiService.accessToken) {
          headers['Authorization'] = `Bearer ${RestApiService.accessToken}`;
      }

      return headers;
  }
}
