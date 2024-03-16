import { Service } from 'typedi';
import { IStreamStateContext, StreamState } from './stream';
import { IProjectTargetStreamDef } from './project';
import { AwaitedCache } from './cache';
import { ProjectsService } from './projects.service';
import { IStreamService } from './streams/stream.service';
import { EntitiesServiceWithFactory } from './entities.service';
import { Autowired } from './utils';
import { logError } from './logger';

@Service()
export class StreamsService extends EntitiesServiceWithFactory<IStreamService> {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<StreamState>();

  get domain() {
    return 'Stream';
  }

  async getState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>, context?: IStreamStateContext) {
    context = context ? { ...context } : {};

    const key = `${stream.ref.projectId}:${stream.ref.targetId}:${stream.id}`;
    const entity = stream.isDirty || scopes
      ? await this.get(stream.type).streamGetState(stream, scopes, context)
      : await this.cache.get(key) ?? await this.get(stream.type).streamGetState(stream, scopes, context);

    if (context.artifact) {
      try {
        entity.isSyncing = true;

        await this.getArtifactsService(stream).run(
          { artifacts: stream.artifacts, ref: stream.ref },
          entity,
          context.artifact,
          scopes,
        );
      } catch (err) {
        logError(err, 'StreamsService.getState', { ref: stream.ref, scopes });
      } finally {
        entity.isSyncing = false;
      }
    }

    if (entity) {
      entity.version = entity.version ?? await this.getVersioningsService(stream).getCurrent(
        this.projectsService.get(stream.ref.projectId).getTargetByTargetId(stream.ref.targetId),
      );
    }

    stream.isDirty = false;

    this.cache.set(key, entity);

    return entity;
  }

  private getArtifactsService(stream: IProjectTargetStreamDef) {
    return this.projectsService.get(stream.ref.projectId).env.artifacts;
  }

  private getVersioningsService(stream: IProjectTargetStreamDef) {
    return this.projectsService
      .get(stream.ref?.projectId)
      .getEnvVersioningByTargetId(stream.ref?.targetId);
  }
}
