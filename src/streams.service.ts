import { Service } from 'typedi';
import { StreamState } from './stream';
import { IProjectTargetStreamDef } from './project';
import { AwaitedCache } from './cache';
import { ProjectsService } from './projects.service';
import { IStreamService } from './streams/stream.service';
import { EntitiesServiceWithFactory } from './entities.service';
import { Autowired } from './utils';

@Service()
export class StreamsService extends EntitiesServiceWithFactory<IStreamService> {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<StreamState>();

  get domain() {
    return 'Stream';
  }

  async getState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>) {
    const key = `${stream.ref.projectId}:${stream.ref.targetId}:${stream.id}`;
    const entity = stream.isDirty || scopes
      ? await this.get(stream.type).streamGetState(stream, scopes)
      : await this.cache.get(key) ?? await this.get(stream.type).streamGetState(stream, scopes);

    if (entity) {
      entity.version = entity.version ?? await this.getVersioningsService(stream).getCurrent(
        this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId),
      );
    }

    stream.isDirty = false;

    this.cache.set(key, entity);

    return entity;
  }

  private getVersioningsService(stream: IProjectTargetStreamDef) {
    return this.projectsService
      .get(stream.ref?.projectId)
      .getEnvVersioningByTargetId(stream.ref?.targetId);
  }
}
