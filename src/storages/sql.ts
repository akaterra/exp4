import { Service } from 'typedi';
import { IStorageService } from '.';
import { AwaitedCache } from '../cache';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { knex, Knex } from 'knex';
import { Log } from '../logger';
import * as _ from 'lodash';
import { IGeneralManifest } from '../general';
import { iter } from '../utils';
import { TargetState } from '../target-state';
import { StreamState } from '../stream-state';
import { ReleaseState } from '../release-state';

@Service()
export class SqlStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'sql';

  protected cache = new AwaitedCache();
  protected client: Knex;

  constructor(protected config?: {
    uri?: string,
    tableNameUsers?: string,
    tableNameVars?: string,
  }) {
    super();
  }

  @Log('debug')
  async manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>> {
    const manifests: Array<IGeneralManifest | IProjectManifest> = [];

    for (const [ ,maybeSource ] of iter(source)) {
      if (
        maybeSource.startsWith('mysql://') ||
        maybeSource.startsWith('postgresql://') || (
          maybeSource.startsWith('file://') && maybeSource.slice(-3).toLowerCase() === '.db'
        )
      ) {
        const [ uri, collection ] = maybeSource.split('#');
        const client = await this.initClient(uri, false);

        manifests.push(...(await client(collection ?? 'storageManifests')).map((row) => ({
          ...row.def,
          ...row,
        })));

        await client.destroy();
      }
    }

    return manifests;
  }

  @Log('debug')
  async userGet(filter: Record<string, unknown>): Promise<IUser> {
    const qb = (await this.getTableUsers()).qb;

    return (await qb.where(filter).first()) ?? null;
  }

  @Log('debug')
  async userGetByKeyAndType(key: string, type: string): Promise<IUser> {
    const qb = (await this.getTableUsers()).qb;

    return (await qb.where({ key, type }).first()) ?? null;
  }

  @Log('debug')
  async userSetByKeyAndType(key: string, type: string, data: Record<string, unknown>): Promise<void> {
    const qb = (await this.getTableUsers()).qb;

    await qb.insert({
      ..._.mapValues(data, (val) => {
        return val && typeof val === 'object'
          ? JSON.stringify(val)
          : val;
      }),
      key,
      type,
    })
      .onConflict([ 'key', 'type' ])
      .merge(Object.keys(data));
  }

  @Log('debug')
  async varGetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], def: D = null): Promise<D> {
    const intKey = SqlStorageService.getKeyOfType(key, target.id, 'target');
    const cacheKey = `${intKey}:target`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const qb = (await this.getTableVars()).qb;

    return (await qb.where({ key: intKey, type: 'target' }).first())?.val ?? def;
  }

  @Log('debug')
  async varSetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], val: D = null): Promise<void> {
    const intKey = SqlStorageService.getKeyOfType(key, target.id, 'target');
    const qb = (await this.getTableVars()).qb;

    await qb.insert({ key: intKey, type: 'target', val: JSON.stringify(val) })
      .onConflict([ 'key', 'type' ])
      .merge([ 'val' ]);

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
    const intKey = SqlStorageService.getKeyOfType(key, stream.id);
    const cacheKey = `${intKey}:stream`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const qb = (await this.getTableVars()).qb;

    return (await qb.where({ key: intKey, type: 'stream' }).first())?.val ?? def;
  }

  @Log('debug')
  async varSetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], val: D = null): Promise<void> {
    const intKey = SqlStorageService.getKeyOfType(key, stream.id);
    const qb = (await this.getTableVars()).qb;

    await qb.insert({ key: intKey, type: 'stream', val: JSON.stringify(val) })
      .onConflict([ 'key', 'type' ])
      .merge([ 'val' ]);

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
    await (await this.getTableUsers()).qb.delete();
    await (await this.getTableVars()).qb.delete();
  }

  protected static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getKeyOfType(key: string | string[], id: IProjectTargetStreamDef['id'], type?: string): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}__${type ?? 'stream'}__${id}`.toLowerCase().replace(/\-/g, '_');
  }

  protected async getClient() {
    if (!this.client) {
      this.client = await this.initClient(null, true);
    }

    return this.client;
  }

  protected async getTableUsers(): Promise<{ qb: Knex.QueryBuilder }> {
    return { qb: (await this.getClient())(this.config?.tableNameVars ?? 'storageUsers') };
  }

  protected async getTableVars(): Promise<{ qb: Knex.QueryBuilder }> {
    return { qb: (await this.getClient())(this.config?.tableNameVars ?? 'storageVars') };
  }

  protected async initClient(uri?, initTables?) {
    const client = knex(uri ?? this.config?.uri ?? process.env.SQL_URL);

    if (initTables) {
      if (!await client.schema.hasTable(this.config?.tableNameUsers ?? 'storageUsers')) {
        await client.schema.createTableIfNotExists(this.config?.tableNameUsers ?? 'storageUsers', (table) => {
          table.string('key', 100).notNullable();
          table.string('type', 100).notNullable();
          table.string('ownerKey', 50);
          table.string('name', 50).notNullable();
          table.string('email', 50);
          table.jsonb('permissions').defaultTo('{}');
          table.unique([ 'key', 'type' ]);
        });
      }

      if (!await client.schema.hasTable(this.config?.tableNameVars ?? 'storageVars')) {
        await client.schema.createTableIfNotExists(this.config?.tableNameVars ?? 'storageVars', (table) => {
          table.string('key', 100).notNullable();
          table.string('type', 20).notNullable();
          table.jsonb('val');
          table.unique([ 'key', 'type' ]);
        });
      }
    }

    return client;
  }
}
