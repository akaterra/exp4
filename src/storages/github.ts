import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { IntegrationsService } from '../integrations.service';
import { GithubIntegrationService } from '../integrations/github';
import { IUser } from '../user';
import { Log } from '../logger';
import { IGeneralManifest } from '../general';

@Service()
export class GithubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'github';

  @Autowired() protected integrationsService: IntegrationsService;
  protected cache = new AwaitedCache();

  private get integration() {
    return this.integrationsService.get(
      this.config?.integration ?? 'default',
      this.type,
    ) as GithubIntegrationService;
  }

  constructor(protected config?: { integration?: string, noCache?: boolean }) {
    super();
  }

  @Log('debug')
  async manifestsLoad(): Promise<Array<IGeneralManifest | IProjectManifest>> {
    return [];
  }

  @Log('debug')
  async userGet(): Promise<IUser> {
    return null;
  }

  @Log('debug')
  async userGetByKeyAndType(id: string): Promise<IUser> {
    const member = (await this.integration.orgMembersList()).find((member) => String(member.id) === id);

    if (member) {
      const user = await this.integration.userGet(member.login);

      return {
        id,
        type: this.type,

        email: null,
        name: user.name,
        phoneNumber: null,
        status: null,
      };
    }

    return null;
  }

  @Log('debug')
  async userSetByKeyAndType(): Promise<void> {

  }

  @Log('debug')
  async varGetTarget<D>(target: IProjectTargetDef, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = GithubStorageService.getKeyOfType(key, target.id, 'target');
    
    if (!this.config?.noCache && this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = isComplex
      ? GithubStorageService.tryParseComplex(await this.integration.orgVarGet(intKey))
      : await this.integration.orgVarGet(intKey);

    if (val !== undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  @Log('debug')
  async varSetTarget<D>(target: IProjectTargetDef, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = GithubStorageService.getKeyOfType(key, target.id, 'target');

    if (await this.varGetTarget(target, key) === null) {
      await this.integration.orgVarCreate(intKey, isComplex
        ? GithubStorageService.getVarComplex(val)
        : val,
      );
    } else {
      await this.integration.orgVarUpdate(intKey, isComplex
        ? GithubStorageService.getVarComplex(val)
        : val,
      );
    }

    this.cache.set(intKey, val, 60);
  }

  @Log('debug')
  async varAddTarget<D>(
    target: IProjectTargetDef,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGetTarget(target, key, null, true);

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

    await this.varSetTarget(target, key, intVal, true);

    return val;
  }

  @Log('debug')
  async varIncTarget(target: IProjectTargetDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetTarget(target, key, '0'));

    await this.varSetTarget(target, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  @Log('debug')
  async varGetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = GithubStorageService.getKeyOfType(key, stream.id);

    if (!this.config?.noCache && this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = isComplex
      ? GithubStorageService.tryParseComplex(await this.integration.orgVarGet(intKey))
      : await this.integration.orgVarGet(intKey);

    if (val !== undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  async varSetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = GithubStorageService.getKeyOfType(key, stream.id);

    if (await this.varGetStream(stream, key) === null) {
      await this.integration.orgVarCreate(intKey, isComplex
        ? GithubStorageService.getVarComplex(val)
        : val,
      );
    } else {
      await this.integration.orgVarUpdate(intKey, isComplex
        ? GithubStorageService.getVarComplex(val)
        : val,
      );
    }

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

    await this.varSetStream(stream, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  async truncateAll(): Promise<void> {

  }

  protected static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `sf__${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getKeyOfType(key: string | string[], id: IProjectTargetStreamDef['id'], type?: string): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `sf__${key}__${type ?? 'stream'}__${id}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getVarComplex(val) {
    return JSON.stringify(val);
  }

  protected static tryParseComplex(val) {
    try {
      return typeof val === 'string' ? JSON.parse(val) : val;
    } catch (err) {
      return undefined;
    }
  }
}
