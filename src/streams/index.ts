import { IStreamStateContext, StreamState } from '../stream-state';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { TargetState } from '../target-state';
import { IService } from '../entities.service';
import { Service } from 'typedi';
import { AwaitedCache, Mutex } from '../cache';
import { ProjectsService } from '../projects.service';
import { EntitiesServiceWithFactory } from '../entities.service';
import { Autowired, CallbacksContainer } from '../utils';
import { logError } from '../logger';
import {EVENT_STREAM_STATE_REREAD_FINISHED, EVENT_STREAM_STATE_REREAD_STARTED, EVENT_TARGET_STATE_REREAD_STARTED} from '../const';

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

  constructor(public readonly callbacksContainer: CallbacksContainer = new CallbacksContainer()) {
    super();
  }

  async rereadState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>, context?: IStreamStateContext): Promise<StreamState> {
    context = context ? { ...context } : {};

    const project = this.projectsService.get(stream.ref?.projectId);
    const key = `${stream.ref.projectId}:${stream.ref.targetId}:${stream.id}`;
    const release = await this.mutex.acquire(key);

    try {
      const streamState = stream.isDirty || scopes
        ? await this.get(stream.type).streamGetState(stream, scopes, context)
        : await this.cache.get(key) ?? await this.get(stream.type).streamGetState(stream, scopes, context);

      if (!streamState) {
        return null;
      }

      await this.callbacksContainer.run(
        EVENT_STREAM_STATE_REREAD_STARTED,
        { stream, streamState },
      );

      streamState.stream = stream;

      if (context.artifact) {
        try {
          streamState.isSyncing = true;

          await project.env.artifacts.run(
            { artifacts: stream.artifacts, ref: stream.ref },
            streamState,
            context.artifact,
            scopes,
          );
        } catch (err) {
          logError(err, 'StreamsService.rereadState', { ref: stream.ref, scopes });
        } finally {
          streamState.isSyncing = false;
        }
      }

      streamState.version = streamState.version ?? await project
        .getEnvVersioningByTargetStream(stream)
        .getCurrent(project.getTargetByTargetStream(stream));

      stream.isDirty = false;

      this.cache.set(key, streamState);
      streamState.isDirty = false;

      await this.callbacksContainer.run(
        EVENT_STREAM_STATE_REREAD_FINISHED,
        { stream, streamState },
      );

      return streamState;
    } finally {
      release();
    }
  }
}
