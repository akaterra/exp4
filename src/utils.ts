import Container from 'typedi';
import * as _ from 'lodash';
import fs from 'fs';
import { logError } from './logger';
import { rest } from './services/rest-api.service';

export const IS_TEST = process.env.NODE_ENV === 'test';
const MS_WAIT = 1000;

export class AwaitableContainer {
  private buckets = new Map<string, {
    awaitables: [
      Promise<any> | ((...args: any[]) => Promise<any>),
      any[],
      string,
    ][];
    awaitablesNextId?: number;
    executor?: Promise<void>,
    onResolve?;
  }>();
  private resolve: (...args: any[]) => void = null;
  private selectedBucketId: string = null;
  private selectedGroupId: string = null;
  private selectedRunAsync: boolean = false;

  constructor(private max: number = 3, private runInBatch: boolean = true) {
    const exec = async () => {
      for (const [ bucketId, bucket ] of this.buckets.entries()) {
        if (!bucket.executor) {
          bucket.executor = this.exec(bucketId);
        }
      }
    }

    setInterval(exec, 2000);
  }

  get async() {
    this.selectedRunAsync = true;

    return this;
  }

  onResolve(resolve: (...args: any[]) => void) {
    this.resolve = resolve;

    return this;
  }

  onBucket(bucketId: string) {
    this.selectedBucketId = bucketId;

    return this;
  }

  onGroup(groupId: string) {
    this.selectedGroupId = groupId;

    return this;
  }

  push(awaitable: Promise<any> | ((...args: any[]) => Promise<any>), ...args: any[]) {
    const bucketId = this.selectedBucketId;
    this.selectedBucketId = null;
    const group = this.selectedGroupId;
    this.selectedGroupId = null;
    const runAsync = this.selectedRunAsync;
    this.selectedRunAsync = false;
    const resolve = this.resolve;
    this.resolve = null;
    let bucket = this.buckets.get(bucketId);

    if (!bucket) {
      bucket = { awaitables: [], onResolve: resolve };

      this.buckets.set(bucketId, bucket);
    }

    bucket.awaitables.push([ awaitable, args, group ]);

    if (!bucket.executor) {
      if (this.runInBatch && bucket.awaitables.length < this.max) {
        return null;
      }

      bucket.executor = this.exec(bucketId);
    }

    return this.runInBatch && !runAsync ? bucket.executor : null;
  }

  async wait() {
    const bucketId = this.selectedBucketId;
    this.selectedBucketId = null;
    const group = this.selectedGroupId;
    this.selectedGroupId = null;
    const bucket = this.buckets.get(bucketId);

    if (!bucket) {
      return;
    }

    if (!bucket.executor) {
      bucket.executor = this.exec(bucketId);
    }

    if (group) {
      while (true) {
        if (!bucket.awaitables.some((awaitable) => awaitable?.[2] === group)) {
          return;
        }

        await new Promise((r) => setTimeout(r, MS_WAIT));
      }
    }

    return bucket.executor;
  }

  private async exec(id: string) {
    const bucket = this.buckets.get(id);

    if (!bucket) {
      return;
    }

    while ((bucket.awaitablesNextId ?? 0) < bucket.awaitables.length) {
      const l = bucket.awaitables.length;

      for (let i = bucket.awaitablesNextId ?? 0; i < l; i += this.max) {
        let promises = null;
        let j = -1;

        for (const awaitable of bucket.awaitables.slice(i, i + this.max)) {
          j += 1;

          if (awaitable === null) {
            continue;
          }

          if (!promises) {
            promises = [];
          }

          const awaited = typeof awaitable[0] === 'function'
            ? awaitable[0](...awaitable[1])
            : awaitable[0];
          const awaitedInd = i + j;

          if (awaited instanceof Promise) {
            awaited.finally(() => bucket.awaitables[awaitedInd] = null);
          } else {
            bucket.awaitables[awaitedInd] = null;
          }

          promises.push(awaited);
        }

        if (!promises?.length) {
          continue;
        }

        await Promise.all(promises).catch((err) => {
          logError(err, 'AwaitableContainer.exec');
        });
      }

      bucket.awaitablesNextId = l;

      await new Promise((r) => setTimeout(r, MS_WAIT));
    }

    this.buckets.delete(id);
    bucket.executor = null;

    if (bucket.onResolve) {
      bucket.onResolve();
    }

    return null;
  }
}

export class CallbacksContainer {
  protected callbacks: Record<string, { fn: (...args) => any, isAsync: boolean }[]> = {};

  register(event: string, fn: (...args) => any, isAsync: boolean = false) {
    if (!this.callbacks[event]) {
      this.callbacks[event] = [];
    }

    this.callbacks[event].push({ fn, isAsync });
  }

  unregister(event: string, fn: (...args) => any) {
    if (!this.callbacks[event]) {
      return;
    }

    this.callbacks[event] = this.callbacks[event].filter((cb) => cb.fn !== fn);
  }

  run(event: string, ...args) {
    if (!this.callbacks[event]) {
      return;
    }

    const promises = [];

    for (const cb of this.callbacks[event]) {
      if (cb.isAsync) {
        promises.push(cb.fn(...args));
      } else {
        cb.fn(...args);
      }
    }

    return Promise.all(promises);
  }

  clear() {
    this.callbacks = {};
  }
}

export function loadModules(path, symbolPostfix?) {
  function findSymbol(module) {
    if (module.module) {
      return module.module;
    }

    if (symbolPostfix) {
      const symbol = Object.keys(module).find((key) => key.endsWith(symbolPostfix));

      if (symbol) {
        return module[symbol];
      }
    }

    return null;
  }

  const files = fs.readdirSync(path, { withFileTypes: true });

  return Promise.all(
    files
      .filter((file) => !file.isDirectory() && file.name.slice(-3) === '.js' && file.name.slice(-8) !== '.spec.js')
      .map((file) => import(`${path}/${file.name}`))
  ).then((modules) => {
    return modules
      .map(findSymbol)
      .filter((module) => !!module);
  });
}

export function Autowired(ref?: any | (() => any)) {
  let refSymbol;

  return function (target: Record<string, any>, propertyName: string) {
    Reflect.defineProperty(
      target,
      propertyName,
      {
        get: function() {
          if (!refSymbol) {
            refSymbol = typeof ref === 'function' ? ref() : ref;
          }
      
          const instance = Container.get(refSymbol ?? Reflect.getMetadata('design:type', target, propertyName));

          Reflect.defineProperty(this, propertyName, { value: instance });

          return instance;
        }
      }
    )
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

export function hasScope(scope: string, scopes?: Record<string, boolean>): boolean {
  if (!scopes || scopes['*']) {
    return true;
  }

  return !!scopes[scope];
}

export function hasStrictScope(scope: string, scopes?: Record<string, boolean>): boolean {
  if (!scopes) {
    return false;
  }

  return !!scopes[scope];
}

export function *iter<T>(iterable: Iterable<T>, predicate?: (val?: any, ind?: number) => boolean): Generator<[ number | string, T extends Array<unknown> ? T[0]: T ]> {
  if (Array.isArray(iterable)) {
    let i = 0;

    for (const item of iterable) {
      if (!predicate || predicate(item, i)) {
        yield [ i, item ];

        i += 1;
      }
    }
  } else {
    if (!predicate || predicate(iterable, 0)) {
      yield [ 0, iterable as T extends Array<unknown> ? T[0]: T ];
    }
  }
}

export async function request(url, data?, method?, authorization?) {
  return rest.withHeaders({
    'Accept': 'application/json',
    'Authorization': authorization ? `Bearer ${authorization}` : undefined,
    'Content-Type': 'application/json',
  }).doRequest(
    url,
    method,
    !method || method === 'get' ? undefined : data,
    !method || method === 'get' ? data : undefined,
  );
}

export function resolvePlaceholders(template, params, returnNullOnEmpty = true) {
  if (typeof template !== 'string') {
    return template;
  }

  const val = template.replace(/\$\{([\w\|\.]+)\}/g, (all, rep) => {
    const keys = rep.split('|');

    if (keys.length < 2) {
      return _.get(params, rep, '');
    }

    for (let i = 0, l = keys.length; i < l; i += 1) {
      // last key is default val
      // keys = ["a", "b", "c"]
      // if "a" and "b" are not defined in params then return value is "c" (not from params)
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

  if (!val && returnNullOnEmpty) {
    return null;
  }

  return val;
}
