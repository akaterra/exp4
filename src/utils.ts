import Container from 'typedi';
import * as _ from 'lodash';
import fetch from 'node-fetch-native';
import YAML from 'yaml'
import fs from 'fs';

const EXTENSIONS = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
};

export class PromiseContainer {
  private promises: Promise<any>[] = [];

  constructor(private max: number = 3) {

  }

  async push(promise: Promise<any> | ((...args: any[]) => Promise<any>), ...args: any[]) {
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

export function loadDefinitionsFromDirectory(path: string): any[] {
  const files = fs.readdirSync(path, { withFileTypes: true });

  return files.filter((file) => !file.isDirectory()).map((file) => loadDefinitionFromFile(`${path}/${file.name}`));
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

export function Autowired(ref?: any | (() => any)) {
  let refSymbol;

  return function(target: Record<string, any>, propertyName: string) {
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

export function *iter(iterable, predicate?: (val?: any, ind?: number) => boolean): Generator<any> {
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
      yield [ 0, iterable ];
    }
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
