import { Service } from 'typedi';
import semver from 'semver';
import { IVersioningService } from './versioning.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IStorageService } from '../storages/storage.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { ProjectsService } from '../projects.service';
import { Log } from '../logger';

export interface ISemverConfig {
  format?: string;
  namespace: string;
  storage: string;
}

export interface ISemverHistoryItem {
  id: string;
  at: Date;
  version: string;
}

@Service()
export class SemverVersioningService extends EntityService implements IVersioningService {
  static readonly type: string = 'semver';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: ISemverConfig) {
    super();
  }

  @Log('debug')
  async getCurrent(target: IProjectTargetDef, format?: false | string): Promise<string> {
    const version = await this.getStorage(target).varGet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      null,
    );

    if (format ?? this.config?.format) {
      return this.format(version, format as string);
    }

    return version;
  }

  async format(version: string, format?: string) {
    return this.getFormatted(version, typeof format === 'string' ? format : this.config?.format);
  }

  @Log('debug')
  async override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string> {
    const sourceVersion = await this.projectsService.get(source.ref.projectId).getEnvVersioningByTarget(source).getCurrent(source, false) ?? '0.1.0';
    const storage = this.getStorage(target);

    await this.setTargetVersionHistory(target, storage, sourceVersion);
    await this.setTargetVersion(target, storage, sourceVersion);

    return sourceVersion;
  }

  @Log('debug')
  async patch(target: IProjectTargetDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrent(target, false);
    const storage = this.getStorage(target);

    if (version) {
      if (params?.releaseName) {
        version = semver.inc(version, 'prepatch', params?.releaseName, false);
      } else { 
        version = semver.inc(version, 'patch');
      }
    } else {
      version = '0.1.0';
    }

    await this.setTargetVersionHistory(target, storage, version);
    await this.setTargetVersion(target, storage, version);

    return version;
  }

  @Log('debug')
  async release(target: IProjectTargetDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrent(target, false);
    const storage = this.getStorage(target);

    if (version) {
      if (params?.releaseName) {
        version = semver.inc(version, 'preminor', params?.releaseName, false);
      } else {  
        version = semver.inc(version, 'minor');
      }
    } else {
      version = '0.1.0';
    }

    await this.setTargetVersionHistory(target, storage, version);
    await this.setTargetVersion(target, storage, version);

    return version;
  }

  @Log('debug')
  async rollback(target: IProjectTargetDef): Promise<string> {
    const storage = this.getStorage(target);
    const targetVersion = await this.getCurrent(target, false);
    const versionHistory = await storage.varGet<ISemverHistoryItem[]>(
      target,
      [ 'versionHistory', target.ref.projectId, this.config?.namespace ?? target.id ],
      null,
      true,
    );

    let version = null;

    if (Array.isArray(versionHistory)) {
      const index = versionHistory.findIndex((val) => val?.id === targetVersion);

      if (index !== -1) {
        versionHistory.splice(index, 1);
      }

      version = versionHistory[index - 1]?.version ?? null;

      await storage.varSet(
        target,
        [ 'versionHistory', target.ref.projectId, this.config?.namespace ?? target.id ],
        versionHistory,
        true,
      );
    }

    await this.setTargetVersion(target, storage, version);

    return version;
  }

  @Log('debug')
  async getCurrentStream(target: IProjectTargetStreamDef, format?: false | string): Promise<string> {
    const version = await this.getStorage(this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.ref.targetId)).varGetStream(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.ref.targetId ],
      null,
    );

    if (format || this.config?.format) {
      return this.formatStream(version, format as string);
    }

    return version;
  }

  async formatStream(version: string, format?: string) {
    return this.getFormatted(version, typeof format === 'string' ? format : this.config?.format);
  }

  @Log('debug')
  async overrideStream(source: IProjectTargetDef, target: IProjectTargetStreamDef): Promise<string> {
    const sourceVersion = await this.projectsService.get(source.ref.projectId).getEnvVersioningByTarget(source).getCurrent(source, false) ?? '0.1.0';
    const storage = this.getStorage(this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.ref.targetId));

    await this.setStreamVersionHistory(target, storage, sourceVersion);
    await this.setStreamVersion(target, storage, sourceVersion);

    return sourceVersion;
  }

  @Log('debug')
  async patchStream(stream: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrentStream(stream, false);
    const storage = this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId));

    if (version) {
      version = semver.inc(version, 'patch');
    } else {
      version = '0.1.0';
    }

    if (params?.releaseName) {
      version = semver.inc(version, 'prerelease', params?.releaseName, false);
    }

    await this.setStreamVersionHistory(stream, storage, version);
    await this.setStreamVersion(stream, storage, version);

    return version;
  }

  @Log('debug')
  async releaseStream(stream: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrentStream(stream, false);
    const storage = this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId));

    if (version) {
      version = semver.inc(version, 'minor');
    } else {
      version = '0.1.0';
    }

    if (params?.releaseName) {
      version = semver.inc(version, 'prerelease', params?.releaseName, false);
    }

    await this.setStreamVersionHistory(stream, storage, version);
    await this.setStreamVersion(stream, storage, version);

    return version;
  }

  @Log('debug')
  async rollbackStream(stream: IProjectTargetStreamDef): Promise<string> {
    const target = this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId);
    const targetVersion = await this.getCurrent(target, false);
    const storage = this.getStorage(target);
    const versionHistory = await storage.varGetStream<ISemverHistoryItem[]>(
      stream,
      [ 'versionHistory', stream.ref.projectId, this.config?.namespace ?? stream.id ],
      null,
      true,
    );

    let version = null;

    if (Array.isArray(versionHistory)) {
      const index = versionHistory.findIndex((val) => val?.id === targetVersion);

      if (index !== -1) {
        versionHistory.splice(index, 1);

        version = versionHistory[index - 1]?.version ?? null;

        await storage.varSetStream(
          stream,
          [ 'versionHistory', stream.ref.projectId, this.config?.namespace ?? stream.id ],
          versionHistory,
          true,
        );

        await this.setStreamVersion(stream, storage, version);
      }
    }

    return version;
  }

  @Log('debug')
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

  private getFormatted(version: string, format: string): string {
    if (!version || !format) {
      return version;
    }

    const parsedVersion = semver.parse(version);

    return parsedVersion
      ? resolvePlaceholders(format, { version: parsedVersion })
      : version;
  }

  private getStorage(target: IProjectTargetDef): IStorageService {
    return this.projectsService.get(target.ref.projectId).getEnvStorageByStorageId(this.config?.storage ?? 'default');
  }

  private async setTargetVersion(target: IProjectTargetDef, storage: IStorageService, version: string) {
    await storage.varSet(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      version,
    );
  }

  private async setTargetVersionHistory(target: IProjectTargetDef, storage: IStorageService, version: string) {
    await storage.varAdd<any>(
      target,
      [ 'versionHistory', target.ref.projectId, this.config?.namespace ?? target.id ],
      { id: version, at: new Date(), version },
      (existingVal, val) => existingVal?.version === val?.version,
      20,
    );
  }

  private async setStreamVersion(stream: IProjectTargetStreamDef, storage: IStorageService, version: string) {
    await storage.varSetStream(
      stream,
      [ 'version', stream.ref.projectId, this.config?.namespace ?? stream.id ],
      version,
    );
  }

  private async setStreamVersionHistory(stream: IProjectTargetStreamDef, storage: IStorageService, version: string) {
    await storage.varAddStream<any>(
      stream,
      [ 'versionHistory', stream.ref.projectId, this.config?.namespace ?? stream.id ],
      { id: version, at: new Date(), version },
      (existingVal, val) => existingVal?.version === val?.version,
      20,
    );
  }
}
