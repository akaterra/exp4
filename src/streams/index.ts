import { IStreamStateContext, StreamState } from '../stream-state';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { TargetState } from '../target-state';
import { IService } from '../entities.service';
import { Service } from 'typedi';
import { AwaitedCache, Mutex } from '../cache';
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
  protected mutex = new Mutex();

  get domain() {
    return 'Stream';
  }

  async getState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>, context?: IStreamStateContext): Promise<StreamState> {
    context = context ? { ...context } : {};

    const project = this.projectsService.get(stream.ref?.projectId);
    const key = `${stream.ref.projectId}:${stream.ref.targetId}:${stream.id}`;
    const release = await this.mutex.acquire(key);

    try {
      const entity = stream.isDirty || scopes
        ? await this.get(stream.type).streamGetState(stream, scopes, context)
        : await this.cache.get(key) ?? await this.get(stream.type).streamGetState(stream, scopes, context);

      if (!entity) {
        return null;
      }

      entity.stream = stream;

      if (context.artifact) {
        try {
          entity.isSyncing = true;

          await project.env.artifacts.run(
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

      entity.version = entity.version ?? await project
        .getEnvVersioningByTargetStream(stream)
        .getCurrent(project.getTargetByTargetStream(stream));

      stream.isDirty = false;

      this.cache.set(key, entity);

      return entity;
    } finally {
      release();
    }
  }
}
