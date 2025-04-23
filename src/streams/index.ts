import { IStreamStateContext, StreamState } from '../stream';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { TargetState } from '../target';
import { IService } from '../entities.service';
import { Service } from 'typedi';
import { AwaitedCache } from '../cache';
import { ProjectsService } from '../projects.service';
import { EntitiesServiceWithFactory } from '../entities.service';
import { Autowired } from '../utils';
import { logError } from '../logger';

export enum StreamServiceStreamMoveOptsStrategy {
  APPROVE = 'approve',
  REQUEST = 'request',
}

export interface IStreamServiceStreamMoveOpts {
  strategy?: StreamServiceStreamMoveOptsStrategy;
}

export interface IStreamService extends IService {
  actionRun(id: string);

  streamBookmark(stream: IProjectTargetStreamDef): Promise<StreamState>;

  streamDetach(stream: IProjectTargetStreamDef): Promise<StreamState>;

  streamGetState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>, context?: IStreamStateContext): Promise<StreamState>;

  streamMove(sourceStream: IProjectTargetStreamDef, targetStream: IProjectTargetStreamDef, opts?: IStreamServiceStreamMoveOpts);

  targetGetState(target: IProjectTargetDef, scopes?: Record<string, boolean>): Promise<TargetState>;
}

@Service()
export class StreamHolderService extends EntitiesServiceWithFactory<IStreamService> {
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
