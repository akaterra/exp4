export class Cache<T = any> {
  protected cache = new Map<string, [ number, T ]>();

  get(key: string, def?: T) {
    if (this.cache.has(key)) {
      const [ expire, val ] = this.cache.get(key);

      return expire
        ? expire >= Date.now() ? val : def
        : val;
    }

    return def;
  }

  has(key: string) {
    if (this.cache.has(key)) {
      const [ expire, ] = this.cache.get(key);

      return expire
        ? expire >= Date.now()
        : true;
    }

    return false;
  }

  set(key: string, val: T, ttlSec?: number, updTtl?: boolean) {
    let expire;

    if (!updTtl) {
      if (this.cache.has(key)) {
        [ expire, ] = this.cache.get(key);
      }
    }

    this.cache.set(key, [ expire ?? (ttlSec ? Date.now() + ttlSec * 1000 : null), val ]);

    return this;
  }
}