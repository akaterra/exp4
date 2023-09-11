export class AwaitedCache<T = any, K = string> {
  protected cache = new Map<K, [ number, number, T | Promise<T> ]>(); // expire, version, val

  del(key: K) {
    this.cache.delete(key);

    return this;
  }

  get(key: K, def?: T): T | Promise<T> {
    if (this.cache.has(key)) {
      const [ expire, , val ] = this.cache.get(key);

      return expire
        ? expire >= Date.now() ? val : def
        : val;
    }

    return def;
  }

  has(key: K) {
    if (this.cache.has(key)) {
      const [ expire, ] = this.cache.get(key);

      return expire
        ? expire >= Date.now() - 2000
        : true;
    }

    return false;
  }

  set(key: K, val: T | Promise<T>, ttlSec?: number, updTtl?: boolean) {
    let expire;
    let version;
    let set = true;

    if (!updTtl) {
      if (this.has(key)) {
        [ expire, version, ] = this.cache.get(key);
      }
    }

    version = !version ? 1 : version + 1;

    if (val instanceof Promise) {
      if (this.cache.has(key)) {
        set = false;
      }

      val.then((res) => {
        if ((this.cache.get(key)?.[1] ?? 1) <= version) {
          this.set(key, res, ttlSec, updTtl);
        }

        return res;
      }).catch((err) => {
        this.del(key);

        return Promise.reject(err);
      });
    }

    if (set) {
      this.cache.set(key, [
        expire ?? (ttlSec ? Date.now() + ttlSec * 1000 : null),
        version,
        val,
      ]);
    }

    return val;
  }
}