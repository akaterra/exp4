import { computed, makeObservable, observable } from 'mobx';
import * as _ from 'lodash';

export type FormStoreSchemaDef = {
  constraints?: {
    enum?: unknown[];
    max?: number;
    min?: number;
    maxLength?: number;
    minLength?: number;
    optional?: boolean;
    value?: string;
  };
  title?: string;
  type?: 'boolean' | 'const' | 'date' | 'enum' | 'number' | 'string' | 'value' | FormStoreSchema;
  initialValue?: unknown;
};
export type FormStoreSchema = Record<string, FormStoreSchemaDef>;

export class FormStore<
  T extends Record<string, any> = Record<string, any>,
  U extends { [K in keyof T]: K extends keyof T ? FormStoreSchemaDef : never } = { [K in keyof T]: K extends keyof T ? FormStoreSchemaDef : never }
> {
  isError: Record<string, null | string> = {};
  isValid: boolean = false;
  state: T;

  protected extra: Record<string, typeof observable | typeof computed | boolean>;
  protected isErrorCheck: Record<string, null | string> = {};
  protected schemaKeysRefs: Record<string, FormStoreSchemaDef> = {};

  constructor(public readonly schema: U) {
    this.clear();

    makeObservable(this.state, Object.keys(schema).reduce((acc, key) => {
      acc[key] = observable;

      return acc;
    }, {}));
    makeObservable(this, { isError: observable, isValid: observable });

    if (this.extra) {
      const extra = Object.entries(this.extra).reduce((acc, [ key, val ]) => {
        if (val === true) {
          acc[key] = observable;
        } else if (typeof val === 'function') {
          acc[key] = val;
        }

        return acc;
      }, {});

      makeObservable(this, extra);
    }
  }

  setError(fields: Record<string, string>) {
    for (const [ key, val ] of Object.entries(fields)) {
      this.isError[key] = val;
    }
  }

  clear() {
    this.state = Object.keys(this.schema).reduce((acc, key) => {
      const def = this.schema[key];
      
      if (def?.initialValue !== undefined) {
        acc[key] = def.initialValue;
      } else {
        acc[key] = null;
      }

      return acc;
    }, {}) as T;

    this.validateAll(true);

    if (!Object.keys(this.schema).length) {
      this.isValid = true; 
    }
  }

  get(key: string): unknown {
    return _.get(this.state, key);
  }

  onChange(key, val) {
    const optsKey = this.schema[key];
    let isConst = false;

    switch (optsKey?.type) {
    case 'boolean':
      val = val === 'true' ? true : val === 'false' ? false : !!val;
      break;
    case 'const':
      isConst = true;
      return;
    case 'date':
      val = new Date(val);
      break;
    case 'number':
      val = parseInt(val, 10);
      break;
    }

    if (!isConst) {
      _.set(this.state, key, val);
    }

    this.validate(key, val, true);
  }

  validate(key, val?, onlyCheck?, schema?: FormStoreSchema): void {
    if (val === undefined) {
      val = _.get(this.state, key);
    }

    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        this.validate(key + '.' + i, v ?? null, onlyCheck, schema);
      });

      return;
    }

    let schemaKey = this.schemaKeysRefs[key];

    if (!schemaKey) {
      schema = schema ?? this.schema;

      if (key.includes('.')) {
        const keys = key.split('.');

        for (let i = 0, l = keys.length; i < l; i ++) {
          if (i === l - 1) {
            schemaKey = schema?.[keys[i]];
          } else if (isNaN(keys[i])) {
            schema = schema?.[keys[i]]?.type as FormStoreSchema;
          }
        }
      } else {
        schemaKey = schema[key];
      }

      this.schemaKeysRefs[key] = schemaKey;
    }

    if (!schemaKey) {
      return;
    }

    if (val && typeof val === 'object' && schemaKey && typeof schemaKey.type === 'object') {
      for (const k of Object.keys(schemaKey.type)) {
        this.validate(key + '.' + k, val[k], onlyCheck, schemaKey.type as FormStoreSchema);
      }

      return;
    }

    let err: null | string = null;

    if (schemaKey?.constraints) {
      const c = schemaKey?.constraints;
      let ignore = false;

      if (typeof c?.optional === 'boolean') {
        if (val === '' || val == null) {
          if (!c.optional) {
            err = `Required`;
          } else {
            ignore = true;
          }
        }
      }

      if (!ignore) {
        if (!err && Array.isArray(c?.enum)) {
          if (!c.enum.includes(val)) {
            err = `Must be one of ${c.enum.map((e) => `"${e}"`).join(', ')} values`;
          }
        }

        if (!err && typeof c?.max === 'number') {
          if (parseInt(val, 10) > c.max) {
            err = `Must be less than ${c.max}`;
          }
        }

        if (!err && typeof c?.min === 'number') {
          if (parseInt(val, 10) < c.min) {
            err = `Must be greater than ${c.min}`;
          }
        }

        if (!err && typeof c?.maxLength === 'number') {
          if ((val?.length ?? 0) > c.maxLength) {
            err = `Must not exceed ${c.maxLength} ${c.maxLength === 1 ? 'symbol' : 'symbols'}`;
          }
        }

        if (!err && typeof c?.minLength === 'number') {
          if ((val?.length ?? 0) < c.minLength) {
            err = `Must have at least ${c.minLength} ${c.minLength === 1 ? 'symbol' : 'symbols'}`;
          }
        }

        if (!err && typeof c?.value === 'string') {
          if (val !== c.value) {
            err = `Must have "${c.value}" value`;
          }
        }
      }
    }

    if (!onlyCheck || !err) {
      this.isError[key] = err;
    }

    this.isErrorCheck[key] = err;

    if (err) {
      this.isValid = false;
    } else {
      this.isValid = Object.values(this.isError).every((error) => !error) && Object.values(this.isErrorCheck).every((error) => !error);
    }
  }

  validateAll(onlyCheck?, schema?: FormStoreSchema): boolean {
    for (const key of Object.keys(schema ?? this.schema)) {
      this.validate(key, undefined, onlyCheck);
    }

    return this.isValid;
  }
}
