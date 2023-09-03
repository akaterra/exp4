import { Inject, Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef, Project } from './project';
import { StreamsService } from './streams.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';
import { IStream } from './stream';
import { ITarget } from './target';
import { PromiseContainer, iter as iterArr } from './utils';
import { ActionsService } from './actions.service';
import { EntitiesService } from './entities.service';
import { AwaitedCache } from './cache';
import {ProjectState} from './project-state';
import {StatisticsService} from './statistics.service';

@Service()
export class ProjectsService extends EntitiesService<Project> {
  @Inject(() => ActionsService) protected actionsService: ActionsService;
  @Inject(() => StatisticsService) protected statisticsService: StatisticsService;
  @Inject(() => StreamsService) protected streamsService: StreamsService;
  @Inject(() => TargetsService) protected targetsService: TargetsService;
  @Inject(() => VersioningsService) protected versioningsService: VersioningsService;

  private statesCache = new AwaitedCache<ProjectState>();

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
    params?: Record<string, any>,
  ) {
    const project = this.get(projectId);
    const flow = project.getFlow(flowId);

    for (const [ , aId ] of iterArr(actionId)) {
      project.validateParams(flowId, aId, params);

      for (const action of flow.actions[aId].steps) {
        try {
          await this.actionsService.get(action.type).run(action, targetsStreams, params);
        } catch (err) {
          this.statisticsService.add(`projects.${projectId}.errors`, {
            message: err?.message ?? err ?? null,
            time: new Date(),
            type: 'projectFlowAction:run',
          });

          throw err;
        }
      }
    }

    return true;
  }

  async getState(projectId: string, targetId?: string | string[], withRefresh?: boolean): Promise<ProjectState> {
    const project = this.get(projectId);
    const projectState = await this.statesCache.get(projectId) ?? new ProjectState(projectId);

    if (!withRefresh) {
      const replaceDirtyTargetIds = projectState.getDirtyTargetIds();

      if (!replaceDirtyTargetIds.length) {
        if (this.statesCache.has(projectId)) {
          return this.statesCache.get(projectId);
        }
      } else {
        targetId = replaceDirtyTargetIds;
      }
    }

    return this.statesCache.set(projectId, (async () => {
      const promiseContainer = new PromiseContainer(1);
  
      for (const [ ,tId ] of iterArr(targetId ?? Object.keys(project.targets))) {
        const target = project.getTargetByTargetId(tId);
  
        await promiseContainer.push(async () => {
          projectState.setTarget(tId, {
            version: await this.versioningsService.getByTarget(target).getCurrent(target),
          })
  
          const replaceDirtyStreamIds = projectState.getDirtyTargetStreamIds(tId);

          for (const stream of Object.values(target.streams)) {
            if (
              !withRefresh &&
              (
                !replaceDirtyStreamIds.length ||
                !replaceDirtyStreamIds.includes(stream.id)
              )
            ) {
              continue;
            }

            await promiseContainer.push(async () => {
              projectState.setTargetStream(tId, await this.streamGetState(stream));
            });
          }
        });
      }
  
      await promiseContainer.wait();
  
      return projectState;
    })(), 300, true);
  }

  async runStatesResync() {
    for (const projectId of Object.keys(this.entities)) {
      try {
        await this.getState(projectId, null, true);

        this.statisticsService.inc(`projects.${projectId}.statesResyncCount`);
        this.statisticsService.set(`projects.${projectId}.statesResyncAt`, new Date());
      } catch (err) {
        this.statisticsService.add(`projects.${projectId}.errors`, {
          message: err?.message ?? err ?? null,
          time: new Date(),
          type: 'projectState:resync',
        });
      }
    }

    this.statisticsService.inc('general.statesResyncCount');
    this.statisticsService.set('general.statesResyncAt', new Date());

    setTimeout(() => this.runStatesResync(), 120000);
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
