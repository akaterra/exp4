import { Inject, Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { IntegrationsService } from '../integrations.service';
import { GithubIntegrationService } from '../integrations/github';
import { IUser } from '../user';

@Service()
export class GithubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'github';

  @Autowired() protected integrationsService: IntegrationsService;
  protected cache = new AwaitedCache();

  private get integration() {
    return this.integrationsService.get(this.config?.integration ?? 'default', this.type) as GithubIntegrationService;
  }

  constructor(protected config?: { integration?: string }) {
    super();
  }

  async userGet(id: string, type: string): Promise<IUser> {
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

  async varGet<D extends any = any>(target: IProjectTargetDef, key: string | string[], def: D = null): Promise<D> {
    const intKey = GithubStorageService.getKey(key);
    
    if (this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = await this.integration.orgVarGet(intKey);

    if (val !== undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  async varSet<D extends any = any>(target: IProjectTargetDef, key: string | string[], val: D = null): Promise<void> {
    const intKey = GithubStorageService.getKey(key);

    if (await this.varGet(target, key) === null) {
      await this.integration.orgVarCreate(intKey, val);
    } else {
      await this.integration.orgVarUpdate(intKey, val);
    }

    this.cache.set(intKey, val, 60);
  }

  async varAdd<D extends any = any>(target: IProjectTargetDef, key: string | string[], val: D): Promise<D> {
    let intVal;
    
    try {
      intVal = JSON.parse(await this.varGet(target, key, '[]'));
    } catch (err) {

    }

    if (Array.isArray(intVal)) {
      intVal.push(val);
    } else {
      intVal = [ val ];
    }

    await this.varSet(target, key, JSON.stringify(intVal));

    return val;
  }

  async varInc(target: IProjectTargetDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGet(target, key, '0'));

    await this.varSet(target, key, typeof intVal === 'number' ? intVal + add : add);

    return intVal;
  }

  async varGetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], def: D = null): Promise<D> {
    const intKey = GithubStorageService.getKeyStream(key, stream.id);

    if (this.cache.has(intKey)) {
      return this.cache.get(intKey);
    }

    const val = await this.integration.orgVarGet(intKey);

    if (val !== undefined) {
      this.cache.set(intKey, val, 60);
    }

    return val !== undefined ? val : def;
  }

  async varSetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], val: D = null): Promise<void> {
    const intKey = GithubStorageService.getKeyStream(key, stream.id);

    if (await this.varGetStream(stream, key) === null) {
      await this.integration.orgVarCreate(intKey, val);
    } else {
      await this.integration.orgVarUpdate(intKey, val);
    }

    this.cache.set(intKey, val, 60);
  }

  async varAddStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], val: D): Promise<D> {
    let intVal;
    
    try {
      intVal = JSON.parse(await this.varGetStream(stream, key, '[]'));
    } catch (err) {

    }

    if (Array.isArray(intVal)) {
      intVal.push(val);
    } else {
      intVal = [ val ];
    }

    await this.varSetStream(stream, key, JSON.stringify(intVal));

    return val;
  }

  async varIncStream(stream: IProjectTargetStreamDef, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetStream(stream, key, '0'));

    await this.varSetStream(stream, key, typeof intVal === 'number' ? intVal + add : add);

    return intVal;
  }

  private static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `rc__${key}`;
  }

  private static getKeyStream(key: string | string[], streamId: string): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `rc__${key}__${streamId.toLowerCase().replace(/-/g, '_')}`;
  }
}
