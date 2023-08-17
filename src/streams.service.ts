import { Inject, Service } from 'typedi';
import { IStream } from './stream';
import { IProjectTargetStream, IProjectTargetStreamDef } from './project';
import { Cache } from './cache';
import { ProjectsService } from './projects.service';
import { IStreamService } from './streams/stream.service';
import { EntitiesService } from './entities.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';

@Service()
export class StreamsService extends EntitiesService<IStreamService> {
  @Inject(() => ProjectsService) protected projectsService: ProjectsService;
  @Inject(() => TargetsService) protected targetsService: TargetsService;
  @Inject(() => VersioningsService) protected versioningsService: VersioningsService;
  protected cache = new Cache<IStream>();
  protected factories: Record<string, { new (...args): IStreamService, type: string }> = {};

  get domain() {
    return 'Stream';
  }

  addFactory(cls: { new (...args): IStreamService, type: string }) {
    this.factories[cls.type] = cls;

    return this;
  }

  getInstance(type: string, ...args): IStreamService {
    if (!this.factories[type]) {
      throw `${this.domain} "${type}" is not registered`;
    }

    return new this.factories[type](...args);
  }

  async getState(ref: IProjectTargetStreamDef) {
    const key = `${ref.projectId}:${ref.targetId}`;
    const entity = this.cache.get(key) ?? await this.get(ref.type).streamGetState(ref);

    if (entity) {
      const versioning = this.projectsService.get(ref.projectId).getTargetVersioning(ref.targetId);

      entity.version = await this.versioningsService.get(versioning).getCurrent(
        this.projectsService.get(ref.projectId).getTargetByTargetId(ref.targetId),
      );
    }

    this.cache.set(key, entity, 60);

    return entity;
  }
}
