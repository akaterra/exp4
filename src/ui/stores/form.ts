import * as React from 'react-dom';
import { computed, makeObservable, observable } from 'mobx';

export class FormStore {
  $isError: Record<string, null | string> = {};
  $isErrorCheck: Record<string, null | string> = {};
  $isValid: boolean = false;

  constructor(public readonly $opts: Record<string, {
    constraints?: {
      max?: Number;
      min?: number;
      maxLength?: Number;
      minLength?: number;
    };
    title?: string;
    type?: 'number' | 'string';
    value?: unknown;
  }>) {
    this.clear();

    makeObservable(this, Object.keys($opts).reduce((acc, key) => {
      acc[key] = observable;

      return acc;
    }, { $isError: observable, $isValid: observable }));
  }

  clear() {
    for (const [ key, def ] of Object.entries(this.$opts)) {
      this[key] = def.value ?? null;

      this.validate(key, def.value ?? null, true);
    }
  }

  onChange(key, val) {
    const optsKey = this.$opts[key];

    switch (optsKey?.type) {
      case 'number':
        val = parseInt(val, 10);
    }

    this[key] = val;

    this.validate(key, val, true);
  }

  validate(key, val?, onlyCheck?) {
    if (val === undefined) {
      val = this[key];
    }

    const optsKey = this.$opts[key];
    let err: null | string = null;

    if (optsKey?.constraints) {
      const c = optsKey?.constraints;

      if (typeof c?.max === 'number') {
        if (parseInt(val, 10) > c.max) {
          err = `Must be less than ${c.max}`;
        }
      }

      if (typeof c?.min === 'number') {
        if (parseInt(val, 10) < c.min) {
          err = `Must be greater than ${c.min}`;
        }
      }

      if (typeof c?.maxLength === 'number') {
        if ((val?.length ?? 0) > c.maxLength) {
          err = `Must not exceed ${c.maxLength} ${c.maxLength === 1 ? 'symbol' : 'symbols'}`;
        }
      }

      if (typeof c?.minLength === 'number') {
        if ((val?.length ?? 0) < c.minLength) {
          err = `Must have at least ${c.minLength} ${c.minLength === 1 ? 'symbol' : 'symbols'}`;
        }
      }
    }

    if (!onlyCheck || !err) {
      this.$isError[key] = err;
    }

    this.$isErrorCheck[key] = err;

    if (err) {
      this.$isValid = false;
    } else {
      this.$isValid = Object.values(this.$isError).every((error) => !error) && Object.values(this.$isErrorCheck).every((error) => !error);
    }
  }
}
