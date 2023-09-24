import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { Log } from '../logger';
import fs from 'node:fs/promises';
import path from 'path';

@Service()
export class FileStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'file';

  protected cache = new AwaitedCache();

  constructor(protected config?: { dir? }) {
    super();
  }

  @Log('debug')
  async userGet(id: string): Promise<IUser> {
    return (await this.getJson('users'))?.[id] ?? null;
  }

  @Log('debug')
  async userSet(id: string, type: string, data: Record<string, unknown>): Promise<void> {
    const user = await this.userGet(id) ?? {};
    user[id] = { ...data, id, type };
    
    await this.putJson('users', user);
  }

  @Log('debug')
  async varGet<D>(target: IProjectTargetDef, key: string | string[], def: D = null): Promise<D> {
    const intKey = FileStorageService.getKey(key);
    const cacheKey = `${intKey}:target`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return (await this.getJson(intKey)) ?? def;
  }

  @Log('debug')
  async varSet<D>(target: IProjectTargetDef, key: string | string[], val: D = null): Promise<void> {
    const intKey = FileStorageService.getKey(key);

    await this.putJson(intKey, val);

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
    const intKey = FileStorageService.getKeyStream(key, stream.id);
    const cacheKey = `${intKey}:stream`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    return (await this.getJson(intKey)) ?? def;
  }

  @Log('debug')
  async varSetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], val: D = null): Promise<void> {
    const intKey = FileStorageService.getKeyStream(key, stream.id);

    await this.putJson(intKey, val);

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

  protected getJsonPath(file: string): string {
    file = encodeURI(file).replace(/\//g, '__');

    return path.resolve(this.config?.dir ?? './projects', `${file}.json`);
  }

  protected getJson(file: string): Promise<any> {
    return fs.readFile(this.getJsonPath(file), 'utf8').then(JSON.parse).catch(() => null);
  }

  protected putJson(file: string, json: any): Promise<any> {
    return fs.writeFile(this.getJsonPath(file), JSON.stringify(json), 'utf8');
  }
}
