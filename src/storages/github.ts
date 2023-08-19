import { Inject, Service } from 'typedi';
import { IStorageService } from './storage.service';
import { Cache } from '../cache';
import { IProjectTargetDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { IntegrationsService } from '../integrations.service';
import { GithubIntegrationService } from '../integrations/github';

@Service()
export class GithubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'github';

  @Autowired() protected integrationsService: IntegrationsService;
  protected cache = new Cache();

  private get integration() {
    return this.integrationsService.get(this.config?.integration ?? 'default', this.type) as GithubIntegrationService;
  }

  constructor(protected config?: { integration?: string }) {
    super();
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

  private static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `rc__${key}`;
  }
}
