import { Inject, Service } from 'typedi';
import semver from 'semver';
import { IVersioningService } from './versioning.service';
import { IProjectTargetDef } from '../project';
import { EntityService } from '../entities.service';
import { IStorageService } from '../storages/storage.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { ProjectsService } from '../projects.service';

export interface ISemverConfig {
  namespace: string;
  storage: string;
}

@Service()
export class SemverVersioningService extends EntityService implements IVersioningService {
  static readonly type: string = 'semver';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: ISemverConfig) {
    super();
  }

  async getCurrent(target: IProjectTargetDef): Promise<string> {
    return this.getStorage(target).varGet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      null,
    );
  }

  async format(target: IProjectTargetDef, entity) {
    if (typeof entity !== 'string') {
      return entity;
    }

    const version = semver.parse(await this.getCurrent(target));
    entity = version
      ? resolvePlaceholders(entity, { version })
      : entity;

    return entity;
  }

  async override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string> {
    const sourceVersion = await this.projectsService.get(source.ref.projectId).getVersioningByTarget(source).getCurrent(source) ?? '0.1.0';

    await this.getStorage(target).varSet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      sourceVersion,
    );

    return sourceVersion;
  }

  async patch(target: IProjectTargetDef): Promise<string> {
    let version = await this.getCurrent(target);

    if (version) {
      version = semver.inc(version, 'patch');
    } else {
      version = '0.1.0';
    }

    await this.getStorage(target).varSet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      version,
    );

    return version;
  }

  async release(target: IProjectTargetDef): Promise<string> {
    let version = await this.getCurrent(target);

    if (version) {
      version = semver.inc(version, 'minor');
    } else {
      version = '0.1.0';
    }

    await this.getStorage(target).varSet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      version,
    );

    return version;
  }

  async exec(source: IProjectTargetDef, target: IProjectTargetDef, action: string): Promise<string> {
    switch (action) {
      case 'current':
        return this.getCurrent(target);
      case 'override':
        return this.override(source, target);
      case 'patch':
        return this.patch(target);
      case 'release':
        return this.release(target);
    }

    throw new Error(`Unknown action: ${action}`);
  }

  private getStorage(target: IProjectTargetDef): IStorageService {
    return this.projectsService.get(target.ref.projectId).getStorageByStorageId(this.config?.storage ?? 'default');
  }
}
