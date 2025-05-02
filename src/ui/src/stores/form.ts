import { makeObservable, observable } from 'mobx';
import * as _ from 'lodash';

export type FormStoreSchema = Record<string, {
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
  type?: 'boolean' | 'const' | 'enum' | 'number' | 'string' | 'value' | FormStoreSchema;
  initialValue?: unknown;
}>;

export class FormStore<T extends FormStoreSchema = FormStoreSchema> {
  __isError: Record<string, null | string> = {};
  __isErrorCheck: Record<string, null | string> = {};
  __isValid: boolean = false;

  constructor(public readonly __schema: T) {
    this.__clear();

    makeObservable(this, Object.keys(__schema).reduce((acc, key) => {
      acc[key] = observable;

      return acc;
    }, { __isError: observable, __isValid: observable }));
  }

  getState() {
    const state: Record<string, unknown> = {};

    for (const key of Object.keys(this.__schema)) {
      state[key] = this[key];
    }

    return state;
  }

  __setError(fields: Record<string, string>) {
    for (const [ key, val ] of Object.entries(fields)) {
      this.__isError[key] = val;
    }
  }

  __clear() {
    for (const [ key, def ] of Object.entries(this.__schema)) {
      this[key] = def.initialValue ?? null;
    }

    this.__validateAll(true);

    if (!Object.keys(this.__schema).length) {
      this.__isValid = true; 
    }
  }

  __get(key: string): unknown {
    return _.get(this, key);
  }

  __onChange(key, val) {
    const optsKey = this.__schema[key];
    let isConst = false;

    switch (optsKey?.type) {
    case 'boolean':
      val = val === 'true' ? true : val === 'false' ? false : !!val;
      break;
    case 'const':
      isConst = true;
      return;
    case 'number':
      val = parseInt(val, 10);
      break;
    }

    _.set(this, key, val);

    this.__validate(key, val, true);
  }

  __validate(key, val?, onlyCheck?, schema?: FormStoreSchema): void {
    if (val === undefined) {
      val = _.get(this, key);
    }

    if (Array.isArray(val)) {
      val.forEach((v, i) => {
        this.__validate(key + '[' + i + ']', v ?? null, onlyCheck, schema);
      });

      return;
    }

    const optsKey = (schema ?? this.__schema)[key];

    if (val && typeof val === 'object' && optsKey && typeof optsKey.type === 'object') {
      for (const k of Object.keys(optsKey.type)) {
        this.__validate(key + '.' + k, val[k], onlyCheck, optsKey.type);
      }

      return;
    }

    let err: null | string = null;

    if (optsKey?.constraints) {
      const c = optsKey?.constraints;
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
      this.__isError[key] = err;
    }

    this.__isErrorCheck[key] = err;

    if (err) {
      this.__isValid = false;
    } else {
      this.__isValid = Object.values(this.__isError).every((error) => !error) && Object.values(this.__isErrorCheck).every((error) => !error);
    }
  }

  __validateAll(onlyCheck?, schema?: FormStoreSchema): boolean {
    for (const key of Object.keys(schema ?? this.__schema)) {
      this.__validate(key, undefined, onlyCheck);
    }

    return this.__isValid;
  }
}
