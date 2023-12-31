import { processingRequest } from "../stores/utils";

export class PublicRestApiService {
  constructor(
		private domain = 'http://127.0.0.1:7000',
		private rootPath = '',
  ) {
  }

  delete(path: string) {
    return this.doRequest(path, 'delete');
  }

  get(path: string, query?: Record<string, any>) {
    return this.doRequest(path, 'get', undefined, query);
  }

  post(path: string, data?: any) {
    return this.doRequest(path, 'post', data);
  }

  put(path: string, data?: any) {
    return this.doRequest(path, 'put', data);
  }

  @processingRequest
  doRequest(path: string, method: 'delete' | 'get' | 'post' | 'put', data?, query?: Record<string, any>) {
    const headers = this.doRequestHeaders();
    const opts = {
      method,
      headers,
      credentials: 'include' as RequestCredentials,
    }

    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
      opts['body'] = JSON.stringify(data);
    }

    return fetch(`${this.domain}/${this.rootPath}${path}?${encodeQuery(query)}`, opts).then((res) => {
      if (res.status >= 200 && res.status <= 299) {
        return res.json();
      }

      return res.json().then((res) => Promise.reject(res));
    });
  }

  protected doRequestHeaders() {
	  const headers: Record<string, string> = {
	    // 'Accept': '*',
	  };

	  return headers;
  }
}

export class RestApiService extends PublicRestApiService {
  static accessToken: string | null = null;
  static refreshToken: string;

  static configure(accessToken, refreshToken) {
    RestApiService.accessToken = accessToken;
    RestApiService.refreshToken = refreshToken;
  }

  protected doRequestHeaders() {
    const headers: any = super.doRequestHeaders();

    if (RestApiService.accessToken && RestApiService.accessToken !== 'null') {
      headers['Authorization'] = `${RestApiService.accessToken}`;
    }

    return headers;
  }
}

function encodeQuery(query: Record<string, any>) {
  if (query && typeof query === 'object') {
    return Object.entries(query).map(([ key, val ]) => {
      if (val == null) {
        return null;
      }

      if (Array.isArray(val)) {
        return `${key}=${val.map((val) => encodeURIComponent(val)).join(',')}`;
      }

      return `${key}=${encodeURIComponent(val)}`;
    }).filter((val) => !!val).join('&');
  }

  return '';
}