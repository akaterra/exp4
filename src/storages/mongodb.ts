import { Service } from 'typedi';
import { IStorageService } from '.';
import { AwaitedCache } from '../cache';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { MongoClient, Db } from 'mongodb';
import { Log } from '../logger';
import { IGeneralManifest } from '../general';
import { iter } from '../utils';
import { TargetState } from '../target-state';
import { StreamState } from '../stream-state';
import { getKeyOfType } from './utils';

@Service()
export class MongodbStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'mongodb';

  protected cache = new AwaitedCache();
  protected client: MongoClient;
  protected db: Db;

  constructor(protected config?: {
    uri?: string,
    collectionUsersName?: string,
    collectionVarsName?: string,
  }) {
    super();
  }

  @Log('debug')
  async manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>> {
    const manifests: Array<IGeneralManifest | IProjectManifest> = [];

    for (const [ ,maybeSource ] of iter(source)) {
      if (maybeSource.startsWith('mongodb://') || maybeSource.startsWith('mongodb+srv://')) {
        const [ uri, collection ] = maybeSource.split('#');
        const [ client, db ] = await this.initClient(uri, false);

        manifests.push(...await db.collection<IGeneralManifest | IProjectManifest>(collection ?? 'storageManifests')
          .find()
          .toArray());

        await client.close();
      }
    }

    return manifests;
  }

  @Log('debug')
  async userGet(filter: Record<string, unknown>): Promise<IUser> {
    const collection = await this.getCollectionUsers();
    const doc = await collection.findOne(filter);

    return doc?.toObject ? doc.toObject() : (doc as any ?? null);
  }

  @Log('debug')
  async userGetByKeyAndType(key: string, type: string): Promise<IUser> {
    const collection = await this.getCollectionUsers();
    const doc = await collection.findOne({ key, type });

    return doc?.toObject ? doc.toObject() : (doc as any ?? null);
  }

  @Log('debug')
  async userSetByKeyAndType(key: string, type: string, data: Record<string, unknown>): Promise<void> {
    const collection = await this.getCollectionUsers();

    await collection.updateOne({ key, type }, {
      $set: {
        ...data,
        type,
      },
    }, { upsert: true });
  }

  @Log('debug')
  async varGetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], def: D = null): Promise<D> {
    const intKey = getKeyOfType(key, target.id, 'target');
    const cacheKey = `${intKey}:target`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const collection = await this.getCollectionVars();

    return (await collection.findOne({ key: intKey, type: 'target' }))?.val ?? def;
  }

  @Log('debug')
  async varSetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], val: D = null): Promise<void> {
    const intKey = getKeyOfType(key, target.id, 'target');
    const collection = await this.getCollectionVars();

    await collection.updateOne({ key: intKey, type: 'target' }, { $set: { val } }, { upsert: true });

    this.cache.set(`${intKey}:target`, val, 10);
  }

  @Log('debug')
  async varAddTarget<D>(
    target: IProjectTargetDef | TargetState,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGetTarget(target, key, null);

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

    await this.varSetTarget(target, key, intVal);

    return val;
  }

  @Log('debug')
  async varIncTarget(target: IProjectTargetDef | TargetState, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetTarget(target, key, '0'));

    await this.varSetTarget(target, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  async varGetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], def: D = null): Promise<D> {
    const intKey = getKeyOfType(key, stream.id);
    const cacheKey = `${intKey}:stream`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const collection = await this.getCollectionVars();

    return (await collection.findOne({ key: intKey, type: 'stream' }))?.val ?? def;
  }

  @Log('debug')
  async varSetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], val: D = null): Promise<void> {
    const intKey = getKeyOfType(key, stream.id);
    const collection = await this.getCollectionVars();

    await collection.updateOne({ key: intKey, type: 'stream' }, { $set: { val } }, { upsert: true });

    this.cache.set(`${intKey}:stream`, val, 10);
  }

  @Log('debug')
  async varAddStream<D>(
    stream: IProjectTargetStreamDef | StreamState,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGetStream(stream, key, null);

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

    await this.varSetStream(stream, key, intVal);

    return val;
  }

  @Log('debug')
  async varIncStream(stream: IProjectTargetStreamDef | StreamState, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetStream(stream, key, '0'));

    await this.varSetStream(stream, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  async truncateAll(): Promise<void> {
    await (await this.getCollectionUsers()).deleteMany();
    await (await this.getCollectionVars()).deleteMany();
  }

  protected async getClient() {
    if (!this.client) {
      const [ client, db ] = await this.initClient(null, true);

      this.client = client;
      this.db = db;
    }

    return this.client;
  }

  protected async getCollectionUsers() {
    await this.getClient();

    return this.db.collection(this.config?.collectionUsersName ?? 'storageUsers');
  }

  protected async getCollectionVars() {
    await this.getClient();

    return this.db.collection(this.config?.collectionVarsName ?? 'storageVars');
  }

  protected async initClient(uri?, initCollection?) {
    const client = new MongoClient(uri ?? this.config?.uri ?? process.env.MONGODB_URL);
    await client.connect();

    const db = client.db();

    if (initCollection) {
      await db.collection(this.config?.collectionVarsName ?? 'storageVars').createIndex({
        key: 1,
        type: 1,
      }, {
        unique: true
      });
    }

    return [ client, db ] as [ MongoClient, Db ];
  }
}
