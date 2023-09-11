import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { MongoClient, Db } from 'mongodb';
import {Log} from '../logger';

@Service()
export class MongodbStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'mongodb';

  protected cache = new AwaitedCache();
  protected client: MongoClient;
  protected db: Db;

  constructor(protected config?: { url?: string, collectionName?: string }) {
    super();
  }

  @Log('debug')
  async userGet(id: string): Promise<IUser> {
    return null;
  }

  @Log('debug')
  async varGet<D>(target: IProjectTargetDef, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = MongodbStorageService.getKey(key);
    const cacheKey = `${intKey}:target`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const collection = await this.getCollection();

    return (await collection.findOne({ key: intKey, type: 'target' }))?.val ?? def;
  }

  @Log('debug')
  async varSet<D>(target: IProjectTargetDef, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = MongodbStorageService.getKey(key);
    const collection = await this.getCollection();

    await collection.updateOne({ key: intKey, type: 'target' }, { $set: { val } }, { upsert: true });

    this.cache.set(`${intKey}:target`, val, 10);
  }

  @Log('debug')
  async varAdd<D>(
    target: IProjectTargetDef,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGet(target, key, null, true);

    if (Array.isArray(intVal)) {
      if (uniq) {
        if (uniq === true) {
          if (intVal.includes(val)) {
            return val;
          }
        } else {
          if (intVal.some((valExisting) => uniq(valExisting, val))) {
            return val;
          }
        }
      }

      intVal.push(val);
    } else {
      intVal = [ val ];
    }

    if (maxLength) {
      intVal = intVal.slice(-maxLength);
    }

    await this.varSet(target, key, intVal, true);

    return val;
  }

  @Log('debug')
  async varInc(target: IProjectTargetDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGet(target, key, '0'));

    await this.varSet(target, key, typeof intVal === 'number' ? intVal + add : add);

    return intVal;
  }

  async varGetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = MongodbStorageService.getKey(key);
    const cacheKey = `${intKey}:stream`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const collection = await this.getCollection();

    return (await collection.findOne({ key: intKey, type: 'stream' }))?.val ?? def;
  }

  @Log('debug')
  async varSetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = MongodbStorageService.getKey(key);
    const collection = await this.getCollection();

    await collection.updateOne({ key: intKey, type: 'stream' }, { $set: { val } }, { upsert: true });

    this.cache.set(`${intKey}:stream`, val, 10);
  }

  @Log('debug')
  async varAddStream<D>(
    stream: IProjectTargetStreamDef,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGetStream(stream, key, null, true);

    if (Array.isArray(intVal)) {
      if (uniq) {
        if (uniq === true) {
          if (intVal.includes(val)) {
            return val;
          }
        } else {
          if (intVal.some((valExisting) => uniq(valExisting, val))) {
            return val;
          }
        }
      }

      intVal.push(val);
    } else {
      intVal = [ val ];
    }

    if (maxLength) {
      intVal = intVal.slice(-maxLength);
    }

    await this.varSetStream(stream, key, intVal, true);

    return val;
  }

  @Log('debug')
  async varIncStream(stream: IProjectTargetStreamDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetStream(stream, key, '0'));

    await this.varSetStream(stream, key, typeof intVal === 'number' ? intVal + add : add);

    return intVal;
  }

  protected static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected async getClient() {
    if (!this.db) {
      this.client = new MongoClient(this.config?.url ?? process.env.MONGODB_URL);
      await this.client.connect();
      this.db = this.client.db();
      await this.db.collection(this.config?.collectionName ?? 'storage').createIndex({
        key: 1,
        type: 1,
      }, {
        unique: true
      });
    }

    return this.client;
  }

  protected async getCollection() {
    await this.getClient();

    return this.db.collection(this.config?.collectionName ?? 'storage');
  }
}
