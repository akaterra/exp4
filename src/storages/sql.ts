import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { knex, Knex } from 'knex';
import { Log } from '../logger';

@Service()
export class SqlStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'sql';

  protected cache = new AwaitedCache();
  protected client: Knex;

  constructor(protected config?: {
    url?: string,
    tableNameUsers?: string,
    tableNameVars?: string,
  }) {
    super();
  }

  @Log('debug')
  async userGet(id: string): Promise<IUser> {
    const qb = (await this.getTableUsers()).qb;

    return (await qb.where({ key: id }).first()) ?? null;
  }

  @Log('debug')
  async varGet<D>(target: IProjectTargetDef, key: string | string[], def: D = null): Promise<D> {
    const intKey = SqlStorageService.getKey(key);
    const cacheKey = `${intKey}:target`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const qb = (await this.getTableVars()).qb;

    return (await qb.where({ key: intKey, type: 'target' }).first())?.val ?? def;
  }

  @Log('debug')
  async varSet<D>(target: IProjectTargetDef, key: string | string[], val: D = null): Promise<void> {
    const intKey = SqlStorageService.getKey(key);
    const qb = (await this.getTableVars()).qb;

    await qb.insert({ key: intKey, type: 'target', val: JSON.stringify(val) })
      .onConflict([ 'key', 'type' ])
      .merge([ 'val' ]);

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
    let intVal = await this.varGet(target, key, null);

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

    await this.varSet(target, key, intVal);

    return val;
  }

  @Log('debug')
  async varInc(target: IProjectTargetDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGet(target, key, '0'));

    await this.varSet(target, key, typeof intVal === 'number' ? intVal + add : add);

    return intVal;
  }

  async varGetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], def: D = null): Promise<D> {
    const intKey = SqlStorageService.getKeyStream(key, stream.id);
    const cacheKey = `${intKey}:stream`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    const qb = (await this.getTableVars()).qb;

    return (await qb.where({ key: intKey, type: 'stream' }).first())?.val ?? def;
  }

  @Log('debug')
  async varSetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], val: D = null): Promise<void> {
    const intKey = SqlStorageService.getKeyStream(key, stream.id);
    const qb = (await this.getTableVars()).qb;

    await qb.insert({ key: intKey, type: 'stream', val: JSON.stringify(val) })
      .onConflict([ 'key', 'type' ])
      .merge([ 'val' ]);

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
  async varIncStream(stream: IProjectTargetStreamDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetStream(stream, key, '0'));

    await this.varSetStream(stream, key, typeof intVal === 'number' ? intVal + add : add);

    return intVal;
  }

  protected static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getKeyStream(key: string | string[], streamId: IProjectTargetStream['id']): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}__${streamId}`.toLowerCase().replace(/\-/g, '_');
  }

  protected async getClient() {
    if (!this.client) {
      const client = knex(this.config?.url ?? process.env.SQL_URL);

      if (!await client.schema.hasTable(this.config?.tableNameUsers ?? 'storageUsers')) {
        await client.schema.createTableIfNotExists(this.config?.tableNameUsers ?? 'storageUsers', (table) => {
          table.string('key', 100).notNullable();
          table.string('name', 50).notNullable();
          table.string('email', 50);
          table.unique([ 'key' ]);
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

      this.client = client;
    }

    return this.client;
  }

  protected async getTableUsers(): Promise<{ qb: Knex.QueryBuilder }> {
    return { qb: (await this.getClient())(this.config?.tableNameVars ?? 'storageUsers') };
  }

  protected async getTableVars(): Promise<{ qb: Knex.QueryBuilder }> {
    return { qb: (await this.getClient())(this.config?.tableNameVars ?? 'storageVars') };
  }
}
