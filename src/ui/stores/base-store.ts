import { makeObservable, observable, computed, action, flow } from 'mobx';
import { alertsStore } from '../blocks/alerts';

export class BaseStore {
  @observable
  isProcessing: boolean = false;

  mapToStores<T extends BaseStore, U extends any>(
    source: Array<U> | Record<string, U>,
    mapper: (val: U, key: typeof source extends Array<U> ? number : string) => T,
    storesMaybeToDispose?: Array<T> | Record<string, T>,
    items?: typeof source extends Array<U> ? Array<T> : Record<string, T>,
  ): typeof source extends Array<U> ? Array<T> : Record<string, T> {
    if (Array.isArray(source)) {
      const result = items as unknown as Array<T> ?? [];

      for (let key = 0; key < source.length; key += 1) {
        const store = mapper(source[key], key as any);

        if (store) {
          result.push(store);
        }
      }

      if (storesMaybeToDispose) {
        for (let i = source.length; i < (storesMaybeToDispose as T[]).length; i += 1) {
          (storesMaybeToDispose as T[])[i].dispose();
        }
      }

      return result as any;
    } else {
      const result = items as Record<string, T> ?? {};

      for (const [ key, val ] of Object.entries(source)) {
        const store = mapper(val, key);

        if (store) {
          result[key] = store;
        }
      }

      if (storesMaybeToDispose) {
        for (const key of Object.keys(storesMaybeToDispose as Record<string, T>)) {
          !result[key] && storesMaybeToDispose[key].dispose();
        }
      }

      return result as any;
    }
  }

  dispose() {

  }

  update(state?) {
    return this;
  }
}
