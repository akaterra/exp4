import { Service } from 'typedi';
import { IStorageService } from '.';
import { AwaitedCache } from '../cache';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired, iter } from '../utils';
import { IUser } from '../user';
import { Log } from '../logger';
import { RestApiService } from '../services/rest-api.service';
import { IGeneralManifest } from '../general';
import { TargetState } from '../target-state';
import { StreamState } from '../stream-state';
import { ReleaseState } from '../release';

@Service()
export class ExternalRestServiceStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'externalRestService';

  protected cache = new AwaitedCache();
  @Autowired() protected restApiService: RestApiService;

  constructor(protected config?: {
    baseUrl: string;
    headers: Record<string, string>;
    noCache: boolean;
  }) {
    super();

    this.restApiService.configure({
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    });
  }

  @Log('debug')
  async manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>> {
    const manifests: Array<IGeneralManifest | IProjectManifest> = [];

    for (const [ ,maybeSource ] of iter(source)) {
      if (maybeSource.startsWith('http://') || maybeSource.startsWith('https://')) {
        const content = await this.restApiService.get(this.getUrl('manifests'));

        if (content && Array.isArray(content)) {
          manifests.push(...manifests);
        }
      }
    }

    return manifests;
  }

  @Log('debug')
  async releaseGet(target: IProjectTargetDef | TargetState, version?: string, def?: ReleaseState): Promise<ReleaseState> {
    const val = await this.varGetTarget(target, [ 'release', version ], null);

    return val !== undefined ? new ReleaseState(val) : def;
  }

  @Log('debug')
  async releaseSet(target: TargetState, version?: string): Promise<void> {
    this.varSetTarget(target, [ 'release', version ], {
      id: target.release.id,
      sections: target.release.sections,
    });
  }

  @Log('debug')
  async userGet(filter: Record<string, unknown>): Promise<IUser> {
    return this.restApiService.get(this.getUrl('user'), filter);
  }

  @Log('debug')
  async userGetByKeyAndType(key: string, type: string): Promise<IUser> {
    return this.restApiService.get(this.getUrl('user'), { key, type });
  }

  @Log('debug')
  async userSetByKeyAndType(key: string, type: string, data: Record<string, unknown>): Promise<void> {
    await this.restApiService.post(this.getUrl('user'), { ...data, key, type });
  }

  @Log('debug')
  async varGetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], def: D = null): Promise<D> {
    const intKey = ExternalRestServiceStorageService.getKeyOfType(key, target.id, 'target');
    
    if (!this.config?.noCache && this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = await this.restApiService.get(
      this.getUrl('var'),
      { id: intKey },
    );

    if (val != undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  @Log('debug')
  async varSetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], val: D = null): Promise<void> {
    const intKey = ExternalRestServiceStorageService.getKeyOfType(key, target.id, 'target');

    await this.restApiService.post(
      this.getUrl('var'),
      val,
      { id: intKey },
    );

    this.cache.set(intKey, val, 60);
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

  @Log('debug')
  async varGetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], def: D = null): Promise<D> {
    const intKey = ExternalRestServiceStorageService.getKeyOfType(key, stream.id);

    if (!this.config?.noCache && this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = await this.restApiService.get(
      this.getUrl('var/stream'),
      { id: intKey },
    );

    if (val != undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  async varSetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], val: D = null): Promise<void> {
    const intKey = ExternalRestServiceStorageService.getKeyOfType(key, stream.id);

    await this.restApiService.post(
      this.getUrl('var/stream'),
      val,
      { id: intKey },
    );

    this.cache.set(intKey, val, 60);
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
    await this.restApiService.delete(
      this.getUrl('all'),
    );
  }

  protected static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `sf__${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getKeyOfType(key: string | string[], id: IProjectTargetStreamDef['id'], type?: string): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `sf__${key}__${type ?? 'stream'}__${id}`.toLowerCase().replace(/\-/g, '_');
  }

  protected getUrl(resource: string) {
    return `${this.config?.baseUrl ?? 'http://localhost:7000'}/${resource}`;
  }
}
