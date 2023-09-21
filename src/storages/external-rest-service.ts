import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { request } from '../utils';
import { IUser } from '../user';
import { Log } from '../logger';
import {rest} from '../services/rest-api.service';

@Service()
export class ExternalRestServiceStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'externalRestService';

  protected cache = new AwaitedCache();

  constructor(protected config?: {
    baseUrl: string;
    headers: Record<string, string>;
  }) {
    super();
  }

  @Log('debug')
  async userGet(id: string, type: string): Promise<IUser> {
    return request(this.getUrl('user'), { id, type });
  }

  @Log('debug')
  async varGet<D>(target: IProjectTargetDef, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = ExternalRestServiceStorageService.getKey(key);
    
    if (this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = await rest.withHeaders(this.config?.headers).get(
      this.getUrl('var'),
      { id: intKey },
    );

    if (val != undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  @Log('debug')
  async varSet<D>(target: IProjectTargetDef, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = ExternalRestServiceStorageService.getKey(key);

    await rest.withHeaders(this.config?.headers).post(
      this.getUrl('var'),
      val,
      { id: intKey },
    );

    this.cache.set(intKey, val, 60);
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

  @Log('debug')
  async varGetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = ExternalRestServiceStorageService.getKeyStream(key, stream.id);

    if (this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = await rest.withHeaders(this.config?.headers).get(
      this.getUrl('var/stream'),
      { id: intKey },
    );

    if (val != undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  async varSetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = ExternalRestServiceStorageService.getKeyStream(key, stream.id);

    await rest.withHeaders(this.config?.headers).post(
      this.getUrl('var/stream'),
      val,
      { id: intKey },
    );

    this.cache.set(intKey, val, 60);
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

    return `rc__${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getKeyStream(key: string | string[], streamId: IProjectTargetStream['id']): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `rc__${key}__${streamId}`.toLowerCase().replace(/\-/g, '_');
  }

  protected getUrl(resource: string) {
    return `${this.config?.baseUrl ?? 'http://localhost:7000'}/${resource}`;
  }
}
