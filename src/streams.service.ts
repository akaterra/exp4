import { Inject, Service } from 'typedi';
import { IStream } from './stream';
import { IProjectTargetStreamDef } from './project';
import { Cache } from './cache';
import { ProjectsService } from './projects.service';
import { IStreamService } from './streams/stream.service';
import { EntitiesServiceWithFactory } from './entities.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';

@Service()
export class StreamsService extends EntitiesServiceWithFactory<IStreamService> {
  @Inject(() => ProjectsService) protected projectsService: ProjectsService;
  @Inject(() => TargetsService) protected targetsService: TargetsService;
  @Inject(() => VersioningsService) protected versioningsService: VersioningsService;
  protected cache = new Cache<IStream>();

  get domain() {
    return 'Stream';
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
