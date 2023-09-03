import { Inject, Service } from 'typedi';
import semver from 'semver';
import { IVersioningService } from './versioning.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
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
    const sourceVersion = await this.projectsService.get(source.ref.projectId).getEnvVersioningByTarget(source).getCurrent(source) ?? '0.1.0';

    await this.getStorage(target).varSet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      sourceVersion,
    );

    return sourceVersion;
  }

  async patch(target: IProjectTargetDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrent(target);

    if (version) {
      if (params?.releaseName) {
        version = semver.inc(version, 'prepatch', params?.releaseName, false);
      } else { 
        version = semver.inc(version, 'patch');
      }
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

  async release(target: IProjectTargetDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrent(target);

    if (version) {
      if (params?.releaseName) {
        version = semver.inc(version, 'preminor', params?.releaseName, false);
      } else {  
        version = semver.inc(version, 'minor');
      }
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

  async getCurrentStream(target: IProjectTargetStreamDef): Promise<string> {
    return this.getStorage(this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.ref.targetId)).varGetStream(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.ref.targetId ],
      null,
    );
  }

  async formatStream(stream: IProjectTargetStreamDef, entity) {
    if (typeof entity !== 'string') {
      return entity;
    }

    const version = semver.parse(await this.getCurrentStream(stream));
    entity = version
      ? resolvePlaceholders(entity, { version })
      : entity;

    return entity;
  }

  async overrideStream(source: IProjectTargetDef, target: IProjectTargetStreamDef): Promise<string> {
    const sourceVersion = await this.projectsService.get(source.ref.projectId).getEnvVersioningByTarget(source).getCurrent(source) ?? '0.1.0';

    await this.getStorage(this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.ref.targetId)).varSetStream(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      sourceVersion,
    );

    return sourceVersion;
  }

  async patchStream(stream: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrentStream(stream);

    if (version) {
      version = semver.inc(version, 'patch');
    } else {
      version = '0.1.0';
    }

    if (params?.releaseName) {
      version = semver.inc(version, 'prerelease', params?.releaseName, false);
    }

    await this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId)).varSetStream(
      stream,
      [ 'version', stream.ref.projectId, this.config?.namespace ?? stream.ref.targetId ],
      version,
    );

    return version;
  }

  async releaseStream(stream: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrentStream(stream);

    if (version) {
      version = semver.inc(version, 'minor');
    } else {
      version = '0.1.0';
    }

    if (params?.releaseName) {
      version = semver.inc(version, 'prerelease', params?.releaseName, false);
    }

    await this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId)).varSetStream(
      stream,
      [ 'version', stream.ref.projectId, this.config?.namespace ?? stream.ref.targetId ],
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
    return this.projectsService.get(target.ref.projectId).getEnvStorageByStorageId(this.config?.storage ?? 'default');
  }
}
