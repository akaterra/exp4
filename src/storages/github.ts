import { Service } from 'typedi';
import { IStorageService } from '.';
import { AwaitedCache } from '../cache';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { IntegrationHolderService } from '../integrations';
import { GithubIntegrationService } from '../integrations/github';
import { IUser } from '../user';
import { Log } from '../logger';
import { IGeneralManifest } from '../general';
import { TargetState } from '../target-state';
import { StreamState } from '../stream-state';
import { getKeyOfType } from './utils';

@Service()
export class GithubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'github';

  @Autowired() protected integrationsService: IntegrationHolderService;
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
    const member = (await this.integration.orgMemberList()).find((member) => String(member.id) === id);

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
  async varGetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = getKeyOfType(key, target.id, 'target');
    
    if (!this.config?.noCache && this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = isComplex
      ? GithubStorageService.tryParseComplex(await this.integration.orgVarGet(intKey))
      : await this.integration.orgVarGet(intKey);

    if (val != null) {
      this.cache.set(intKey, val, 60);
    }

    return val != null ? val : def;
  }

  @Log('debug')
  async varSetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = getKeyOfType(key, target.id, 'target');

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
    target: IProjectTargetDef | TargetState,
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
  async varIncTarget(target: IProjectTargetDef | TargetState, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetTarget(target, key, '0'));

    await this.varSetTarget(target, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  @Log('debug')
  async varGetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], def: D = null, isComplex?: boolean): Promise<D> {
    const intKey = getKeyOfType(key, stream.id);

    if (!this.config?.noCache && this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = isComplex
      ? GithubStorageService.tryParseComplex(await this.integration.orgVarGet(intKey))
      : await this.integration.orgVarGet(intKey);

    if (val != null) {
      this.cache.set(intKey, val, 60);
    }

    return val != null ? val : def;
  }

  async varSetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], val: D = null, isComplex?: boolean): Promise<void> {
    const intKey = getKeyOfType(key, stream.id);

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
    stream: IProjectTargetStreamDef | StreamState,
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
  async varIncStream(stream: IProjectTargetStreamDef | StreamState, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetStream(stream, key, '0'));

    await this.varSetStream(stream, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  async truncateAll(): Promise<void> {

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
