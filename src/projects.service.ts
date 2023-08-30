import { Inject, Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef, Project } from './project';
import { StreamsService } from './streams.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';
import { IStream } from './stream';
import { ITarget } from './target';
import { PromiseContainer, iter } from './utils';
import { ActionsService } from './actions.service';
import { EntitiesService } from './entities.service';
import { Cache } from './cache';

@Service()
export class ProjectsService extends EntitiesService<Project> {
  @Inject(() => ActionsService) protected actionsService: ActionsService;
  @Inject(() => StreamsService) protected streamsService: StreamsService;
  @Inject(() => TargetsService) protected targetsService: TargetsService;
  @Inject(() => VersioningsService) protected versioningsService: VersioningsService;

  private statesCache = new Cache<any>();

  get domain() {
    return 'Project';
  }

  list() {
    return this.entities;
  }

  async flowActionRun(
    projectId: string,
    flowId: string,
    actionId: string | string[],
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
  ) {
    const flow = this.get(projectId).getFlow(flowId);

    for (const [ , aId ] of iter(actionId)) {
      for (const action of flow.actions[aId].steps) {
        await this.actionsService.get(action.type).run(action, targetsStreams);
      }
    }

    return true;
  }

  async getState(projectId: string, targetId?: string | string[], withRefresh?: boolean) {
    const project = this.get(projectId);

    if (!withRefresh) {
      let potentialTargets = [];

      for (const [ ,tId ] of iter(targetId ?? Object.keys(project.targets))) {
        const target = project.getTargetByTargetId(tId);

        if (target.isDirty || Object.values(target.streams).some((stream) => stream.isDirty)) {
          potentialTargets.push(tId);
        }
      }

      if (!potentialTargets.length) {
        let loop = 120;

        while (loop) {
          if (this.statesCache.has(projectId)) {
            return this.statesCache.get(projectId);
          }
  
          loop -= 1;
  
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } else {
        targetId = potentialTargets;
      }
    }

    const oldState = this.statesCache.get(projectId);
    const dirtyState: {
      id: IProjectDef['id'];
      targets: Record<string, {
        id: IProjectTargetDef['id'];
        streams: Record<string, IStream>;
        version: string;
      }>;
    } = {
      ...oldState,
      id: projectId,
      targets: { ...oldState?.targets },
    };
    const promiseContainer = new PromiseContainer(1);

    for (const [ ,tId ] of iter(targetId ?? Object.keys(project.targets))) {
      const target = project.getTargetByTargetId(tId);

      await promiseContainer.push(async () => {
        dirtyState.targets[tId] = {
          id: tId,
          streams: {},
          version: await this.versioningsService.getByTarget(target).getCurrent(target),
        };

        for (const [ sId, stream ] of Object.entries(target.streams)) {
          await promiseContainer.push(async () => {
            dirtyState.targets[tId].streams[sId] = await this.streamGetState(stream);
          });
        }
      });
    }

    await promiseContainer.wait();

    const state: typeof dirtyState = {
      id: projectId,
      targets: {},
    };

    for (const [ ,tId ] of iter(targetId ?? Object.keys(project.targets))) {
      const target = project.getTargetByTargetId(tId);
      state.targets[tId] = {
        ...dirtyState.targets[tId],
        streams: {},
      };

      for (const [ sId, stream ] of Object.entries(target.streams)) {
        state.targets[tId].streams[sId] = dirtyState.targets[tId].streams[sId];
      }
    }

    this.statesCache.set(projectId, state, 120, true);

    return state;
  }

  async runStatesRefresh() {
    for (const projectId of Object.keys(this.entities)) {
      await this.getState(projectId, null, true);
    }

    setTimeout(() => this.runStatesRefresh(), 60000);
  }

  streamGetState(stream: IProjectTargetStreamDef): Promise<IStream>;

  streamGetState(projectId: string, targetId: string, streamId: string): Promise<IStream>;

  async streamGetState(mixed: string | IProjectTargetStreamDef, targetId?: string, streamId?: string) {
    const stream = typeof mixed === 'string'
      ? await this.streamsService.getState(this.get(mixed).getTargetStreamByTargetIdAndStreamId(targetId, streamId))
      : await this.streamsService.getState(mixed);

    return stream;
  }

  targetGetState(stream: IProjectTargetDef): Promise<ITarget>;

  targetGetState(projectId: string, targetId: string): Promise<ITarget>;

  async targetGetState(mixed: string | IProjectTargetDef, targetId?: string) {
    const target = typeof mixed === 'string'
      ? this.targetsService.getState(this.get(mixed).getTargetByTargetId(targetId))
      : this.targetsService.getState(mixed);

    return target;
  }
}
