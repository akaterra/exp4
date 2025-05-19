import { Service } from 'typedi';
import semver from 'semver';
import { IVersioningService } from '.';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IStorageService } from '../storages';
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
export class SemverVersioningService extends EntityService<ISemverConfig> implements IVersioningService {
  static readonly type: string = 'semver';

  @Autowired() protected projectsService: ProjectsService;

  // constructor(public readonly config?: ISemverConfig) {
  //   super();
  // }

  @Log('debug')
  async getCurrent(target: IProjectTargetDef, format?: false | string): Promise<string> {
    const version = await this.getStorage(target).varGetTarget(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      null,
    );

    if (format ?? this.config?.format) {
      return this.format(version, format as string);
    }

    return version;
  }

  async getTargetVar<D>(target: IProjectTargetDef, key: string | string[], def: D, isComplex?: boolean): Promise<D> {
    return await this.getStorage(target).varGetTarget(
      target,
      [
        ...Array.isArray(key) ? key : [ key ],
        target.ref.projectId,
        this.config?.namespace ?? target.id,
        await this.getCurrent(target),
      ],
      def,
      isComplex,
    );
  }

  async setTargetVar<D>(target: IProjectTargetDef, key: string | string[], val: D, isComplex?: boolean): Promise<void> {
    return await this.getStorage(target).varSetTarget(
      target,
      [
        ...Array.isArray(key) ? key : [ key ],
        target.ref.projectId,
        this.config?.namespace ?? target.id,
        await this.getCurrent(target),
      ],
      val,
      isComplex,
    );    
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

    version = incVersion(version, params?.releaseName, 'patch');

    await this.setTargetVersionHistory(target, storage, version);
    await this.setTargetVersion(target, storage, version);

    return version;
  }

  @Log('debug')
  async release(target: IProjectTargetDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrent(target, false);
    const storage = this.getStorage(target);

    version = incVersion(version, params?.releaseName, params?.releaseScope ?? 'major');

    await this.setTargetVersionHistory(target, storage, version);
    await this.setTargetVersion(target, storage, version);

    return version;
  }

  @Log('debug')
  async rollback(target: IProjectTargetDef): Promise<string> {
    const storage = this.getStorage(target);
    const targetVersion = await this.getCurrent(target, false);
    const versionHistory = await storage.varGetTarget<ISemverHistoryItem[]>(
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

      await storage.varSetTarget(
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
  async getCurrentStream(stream: IProjectTargetStreamDef, format?: false | string): Promise<string> {
    const version = await this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTarget(stream.ref.targetId)).varGetStream(
      stream,
      [ 'version', stream.ref.projectId, this.config?.namespace ?? stream.ref.targetId ],
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
    const storage = this.getStorage(this.projectsService.get(target.ref.projectId).getTargetByTarget(target.ref.targetId));

    await this.setStreamVersionHistory(target, storage, sourceVersion);
    await this.setStreamVersion(target, storage, sourceVersion);

    return sourceVersion;
  }

  @Log('debug')
  async patchStream(stream: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrentStream(stream, false);
    const storage = this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTarget(stream.ref.targetId));

    version = incVersion(version, params?.releaseName, 'patch');

    await this.setStreamVersionHistory(stream, storage, version);
    await this.setStreamVersion(stream, storage, version);

    return version;
  }

  @Log('debug')
  async releaseStream(stream: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string> {
    let version = await this.getCurrentStream(stream, false);
    const storage = this.getStorage(this.projectsService.get(stream.ref.projectId).getTargetByTarget(stream.ref.targetId));

    version = incVersion(version, params?.releaseName, params?.releaseScope ?? 'major');

    await this.setStreamVersionHistory(stream, storage, version);
    await this.setStreamVersion(stream, storage, version);

    return version;
  }

  @Log('debug')
  async rollbackStream(stream: IProjectTargetStreamDef): Promise<string> {
    const target = this.projectsService.get(stream.ref.projectId).getTargetByTarget(stream.ref.targetId);
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

  // async getCurrentRelease(target: IProjectTargetDef): Promise<ReleaseState> {
  //   const storage = this.getStorage(target);
  //   const targetVersion = await this.getCurrent(target, false);

  //   return new ReleaseState(await storage.varGetTarget(
  //     target,
  //     [ 'release', target.ref.projectId, this.config?.namespace ?? target.id, targetVersion ],
  //     null,
  //     true,
  //   ) ?? {});
  // }

  // async setCurrentRelease(targetState: TargetState): Promise<void> {
  //   const storage = this.getStorage(targetState.target);
  //   const targetVersion = await this.getCurrent(targetState.target, false);

  //   await storage.varSetTarget(
  //     targetState,
  //     [ 'release', targetState.target.ref.projectId, this.config?.namespace ?? targetState.target.id, targetVersion ],
  //     targetState.release.toJSON(targetState.release.ver + 1),
  //     true,
  //   );
  // }

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
      ? resolvePlaceholders(format, { version: parsedVersion })?.trim()
      : version;
  }

  private getStorage(target: IProjectTargetDef): IStorageService {
    return this.projectsService.get(target.ref.projectId).getEnvStorageByStorageId(this.config?.storage ?? target.config?.storage ?? 'default');
  }

  private async setTargetVersion(target: IProjectTargetDef, storage: IStorageService, version: string) {
    await storage.varSetTarget(
      target,
      [ 'version', target.ref.projectId, this.config?.namespace ?? target.id ],
      version,
    );
  }

  private async setTargetVersionHistory(target: IProjectTargetDef, storage: IStorageService, version: string) {
    await storage.varAddTarget<any>(
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

function incVersion(version, release, releaseScope: 'major' | 'minor' | 'patch') {
  if (!version) {
    return release ? `0.1.0-${release}` : '0.1.0';
  }

  const major = semver.major(version);
  const minor = semver.minor(version);
  const patch = semver.patch(version);
  const prerelease = release || (releaseScope === 'patch' ? semver.prerelease(version) : '');

  let newVersion = `${major}.${minor}.${patch}`;

  switch (releaseScope) {
  case 'major':
    newVersion = semver.inc(newVersion, 'major');
    break;
  case 'minor':
    newVersion = semver.inc(newVersion, 'minor');
    break;
  case 'patch':
    newVersion = semver.inc(newVersion, 'patch');
    break;
  default:
    newVersion = 0 as never;
  }

  return prerelease ? `${newVersion}-${prerelease}` : newVersion;
}
