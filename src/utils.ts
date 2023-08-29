import Container from 'typedi';
import * as _ from 'lodash';
import fetch from 'node-fetch-native';

export class PromiseContainer {
  private promises: Promise<any>[] = [];

  constructor(private max: number = 3) {

  }

  async push(promise: Promise<any> | Function, ...args: any[]) {
    if (typeof promise === 'function') {
      promise = promise(...args);
    }

    this.promises.push(promise as Promise<any>);

    if (this.promises.length >= this.max) {
      const promises = this.promises;
      this.promises = [];

      await Promise.all(promises);
    }
  }

  async wait() {
    await Promise.all(this.promises);
  }
}

export function Autowired(name?: any | (() => any)) {
  return function(target: Object, propertyName: string){
    if (typeof name === 'function') {
      name = name();
    }

    target[propertyName] = Container.get(name ?? Reflect.getMetadata('design:type', target, propertyName));
  }
}

export function *iter(iterable): Generator<any> {
  if (Array.isArray(iterable)) {
    let i = 0;

    for (const item of iterable) {
      yield [ i, item ];

      i += 1;
    }
  } else {
    yield [ 0, iterable ];
  }
}

export function err(fn) {
  return function (req, res, next) {
    try {
      const result = fn(req, res, next);

      if (result instanceof Promise) {
        result.catch((err) => {
          next(err);
        });
      }
    } catch (err) {
      next(err);
    }
  };
}

export async function requestJson(url, data?, method?, authorization?) {
  const response = await fetch(url, {
    method: method ?? 'post',
    headers: {
      'Accept': 'application/json',
      'Authorization': authorization ? `Bearer ${authorization}` : undefined,
      'Content-Type': 'application/json',
    },
    body: data ? JSON.stringify(data) : undefined,
  });

  return response.json();
}

export function resolvePlaceholders(template, params) {
  return template.replace(/\$\{([\w\|\.]+)\}/g, (all, p1) => {
    const keys = p1.split('|');

    if (keys.length < 2) {
      return _.get(params, p1, '');
    }

    for (let i = 0, l = keys.length; i < l; i += 1) {
      if (i === l - 1) {
        return keys[i];
      }

      if (_.has(params, keys[i])) {
        const val = _.get(params, keys[i]);

        if (val === '' || val === null) {
          continue;
        }

        return val;
      }
    }
  });
}
