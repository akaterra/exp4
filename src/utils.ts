import Container from 'typedi';
import * as _ from 'lodash';
import YAML from 'yaml'
import fs from 'fs';
import { logError } from './logger';
import { rest } from './services/rest-api.service';

const EXTENSIONS = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
};

export class AwaitableContainer {
  private buckets = new Map<string, {
    awaitables: [
      Promise<any> | ((...args: any[]) => Promise<any>),
      any[],
    ][];
    awaitablesNextId?: number;
    executor?: Promise<void>,
    onResolve?;
  }>();
  private id: string = null;
  private resolve: (...args: any[]) => void = null;

  constructor(private max: number = 3, private runInBatch: boolean = true) {

  }

  onResolve(resolve: (...args: any[]) => void) {
    this.resolve = resolve;

    return this;
  }

  onId(id: string) {
    this.id = id;

    return this;
  }

  push(awaitable: Promise<any> | ((...args: any[]) => Promise<any>), ...args: any[]) {
    const id = this.id;
    this.id = null;
    const resolve = this.resolve;
    this.resolve = null;
    let bucket = this.buckets.get(id);

    if (!bucket) {
      bucket = { awaitables: [], onResolve: resolve };

      this.buckets.set(id, bucket);
    }

    bucket.awaitables.push([ awaitable, args ]);

    if (!bucket.executor) {
      if (this.runInBatch && bucket.awaitables.length < this.max) {
        return this;
      }

      bucket.executor = this.exec(id);
    }

    return this.runInBatch ? bucket.executor : null;
  }

  async wait(id: string = null) {
    const bucket = this.buckets.get(id);

    if (!bucket) {
      return;
    }

    if (!bucket.executor) {
      bucket.executor = this.exec(id);
    }

    return bucket.executor;
  }

  private async exec(id: string) {
    const bucket = this.buckets.get(id);

    if (!bucket) {
      return;
    }

    while ((bucket.awaitablesNextId ?? 0) < bucket.awaitables.length) {
      for (let i = bucket.awaitablesNextId ?? 0, l = bucket.awaitables.length; i < l; i += this.max) {
        let promises = null;

        for (const awaitable of bucket.awaitables.slice(i, i + this.max)) {
          if (bucket.awaitables[i] === null) {
            continue;
          }

          bucket.awaitables[i] = null;

          if (!promises) {
            promises = [];
          }

          promises.push(
            typeof awaitable[0] === 'function'
              ? awaitable[0](...awaitable[1])
              : awaitable[0]
          );
        }

        if (!promises?.length) {
          break;
        }

        await Promise.all(promises).catch((err) => {
          logError(err, 'AwaitableContainer.exec');
        });
      }

      bucket.awaitablesNextId = bucket.awaitables.length;

      await new Promise((r) => setTimeout(r, 250));
    }

    this.buckets.delete(id);

    if (bucket.onResolve) {
      bucket.onResolve();
    }
  }
}

export function loadDefinitionsFromDirectory(path: string): any[] {
  const files = fs.readdirSync(path, { withFileTypes: true });

  return files
    .filter((file) => !file.isDirectory())
    .map((file) => loadDefinitionFromFile(`${path}/${file.name}`));
}

export function loadDefinitionFromFile(pathOrName: string): any {
  let definition;

  if (Object.keys(EXTENSIONS).some((ext) => pathOrName.slice(-ext.length - 1) === `.${ext}`)) {
    const fileContent = fs.readFileSync(pathOrName, 'utf8');

    switch (pathOrName.slice(pathOrName.lastIndexOf('.') + 1)) {
    case 'json':
      definition = JSON.parse(fileContent);
      break;
    case 'yaml':
      definition = YAML.parse(fileContent);
      break;
    case 'yml':
      definition = YAML.parse(fileContent);
      break;  
    }

    if (definition && typeof definition === 'object') {
      if (!definition.id) {
        definition.id = pathOrName.slice(pathOrName.lastIndexOf('/') + 1, pathOrName.lastIndexOf('.'));
      }
    }
  } else {
    for (const ext of Object.keys(EXTENSIONS)) {
      const filename = `${process.cwd()}/projects/${pathOrName}.${ext}`;

      if (fs.existsSync(filename)) {
        return loadDefinitionFromFile(filename);
      }
    }
  }

  return definition;
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
      .filter((file) => !file.isDirectory() && file.name.slice(-3) === '.js')
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
