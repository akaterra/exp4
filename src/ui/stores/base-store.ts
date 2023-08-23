import { makeObservable, observable, computed, action, flow } from 'mobx';

export class BaseStore {
  @observable
  alerts: Array<{ ts: number, content: string }> = [];

  @observable
  isProcessing: boolean = false;

  mapToStores<T extends BaseStore>(
    source: Array<any> | Record<string, any>,
    mapper: (val: any, key: number | string) => T,
    storesMaybeDisposable?: Array<T> | Record<string, T>,
    items?: typeof source extends Array<any> ? Array<T> : Record<string, T>,
  ): typeof source extends Array<any> ? Array<T> : Record<string, T> {
    if (Array.isArray(source)) {
      const result = items as unknown as Array<T> ?? [];

      for (let key = 0; key < source.length; key += 1) {
        const store = mapper(source[key], key as number);

        if (store) {
          result.push(store);
        }
      }

      if (storesMaybeDisposable) {
        for (let i = source.length; i < (storesMaybeDisposable as T[]).length; i += 1) {
          (storesMaybeDisposable as T[])[i].dispose();
        }
      }

      return result as any;
    } else {
      const result = items as Record<string, T> ?? {};

      for (const [ key, val ] of Object.entries(source)) {
        const store = mapper(val, key);

        if (store) {
          result[key] = val;
        }
      }

      if (storesMaybeDisposable) {
        for (const key of Object.keys(storesMaybeDisposable as Record<string, T>)) {
          !result[key] && storesMaybeDisposable[key].dispose();
        }
      }

      return result as any;
    }
  }

  dispose() {

  }

  pushAlert(content) {
    this.alerts.push({ ts: Date.now(), content });
  }

  update(state?) {
    return this;
  }
}

export function processing(target, prop, descriptor) {
  const fn = descriptor.value;

  function next(g) {
    while (true) {
      const v = g.next();
      
      if (v.done) {
        break;
      }
    }
  }

  descriptor.value = async function *(...args) {
    this.isProcessing = true;

    try {
      const g = fn.call(this, ...args);
      let val;

      while (true) {
        const next = g.next(await val);
        val = next.value;

        yield val;

        if (next.done) {
          break;
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  return descriptor;
}
