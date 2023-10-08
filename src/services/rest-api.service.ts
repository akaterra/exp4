import fetch from 'node-fetch-native';

const DEBUG = process.env.DEBUG;

export class RestApiService {
  private format: string;
  private headers: Record<string, string>;
  private query: Record<string, { toString }>;

  constructor(private opts?: {
    domain?: string;
    path?: string;
    headers?: Record<string, string>;
    format?: 'json' | 'raw' | 'text';
  }) {
  }

  withFormat(format: string) {
    this.format = format;

    return this;
  }

  withHeaders(headers: RestApiService['headers']) {
    this.headers = headers;

    return this;
  }

  withQuery(query: RestApiService['query']) {
    this.query = query;

    return this;
  }

  delete(path: string, query?: Record<string, any>) {
    return this.doRequest(path, 'delete', undefined, query);
  }

  get(path: string, query?: Record<string, any>) {
    return this.doRequest(path, 'get', undefined, query);
  }

  post(path: string, data?: any, query?: Record<string, any>) {
    return this.doRequest(path, 'post', data, query);
  }

  put(path: string, data?: any, query?: Record<string, any>) {
    return this.doRequest(path, 'put', data, query);
  }

  doRequest(path: string, method: 'delete' | 'get' | 'post' | 'put', data?, query?: Record<string, { toString }>) {
    const format = this.format ?? this.opts?.format ?? 'json';
    this.format = null;
    const headers = this.doRequestHeaders();

    if (!query) {
      query = this.query;
      this.query = null;
    }

    const url = path.startsWith('http')
      ? `${path}?${encodeQuery(query)}`
      : `${this.opts?.domain}/${this.opts?.path}${path}?${encodeQuery(query)}`;

    switch (format) {
    case 'json':
      headers['Accept'] = 'application/json';
      break;
    case 'text':
      headers['Accept'] = 'text/plain';
      break;
    }

    let request;

    if (data !== undefined) {
      switch (format) {
      case 'json':
        headers['Content-Type'] = 'application/json';
        data = JSON.stringify(data);
        break;
      }

      if (DEBUG) {
        console.log(url, { method, body: data, headers });
      }

      request = fetch(url, { method, body: data, headers });
    } else {
      if (DEBUG) {
        console.log(url, { method, headers });
      }

      request = fetch(url, { method, headers });
    }
    
    return request.then((res: Response) => {
      let tempRes: any = res;

      switch (res.headers.get('content-type') ?? format) {
      case 'application/json':
      case 'json':
        tempRes = res.json();
        break;
      case 'application/xml':
      case 'text':
      case 'text/csv':
      case 'text/plain':
      case 'text/xml':
        tempRes = res.text();
        break;
      case 'application/x-www-form-urlencoded':
      case 'form':
        tempRes = res.formData();
        break;
      default:
        tempRes = null;
      }

      if (res.status >= 200 && res.status <= 299) {
        return tempRes;
      }

      if (tempRes instanceof Promise) {
        return tempRes.then((res) => Promise.reject(res));
      }

      return Promise.reject(res);
    });
  }

  protected doRequestHeaders() {
	  const headers: Record<string, string> = {
	    ...this.opts?.headers,
      ...this.headers,
	  };
    this.headers = null;

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

export const rest = new RestApiService();
