export class Cache<T = any, K = string> implements Iterable<[K, T | Promise<T>]> {
  protected autoInvalidateTimeout;
  protected cache = new Map<K, [ number, number, T | Promise<T> ]>(); // expire, version, val

  *[Symbol.iterator](): IterableIterator<[K, T | Promise<T>]> {
    for (const keyVal of this.cache.entries()) {
      yield [ keyVal[0], keyVal[1][2] ];
    }
  }

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

  runAutoInvalidate() {
    if (!this.autoInvalidateTimeout) {
      this.autoInvalidateTimeout = setInterval(() => {
        const now = Date.now();

        for (const [ key, val ] of this.cache.entries()) {
          const [ expire, ] = val;

          if (expire && expire >= now - 2000) {
            this.cache.delete(key);
          }
        }
      }, 30000);
    }

    return this;
  }
}

export class Mutex {
  private locks = new Map<string, Promise<void>>();

  async acquire(id: string): Promise<() => void> {
    if (this.locks.has(id)) {
      await this.locks.get(id);
    }

    let release: () => void;

    const lock = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.locks.set(id, lock);

    lock.then(() => {
      this.locks.delete(id);
    });

    return release!;
  }
}
