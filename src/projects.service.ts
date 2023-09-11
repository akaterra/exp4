import { Inject, Service } from 'typedi';
import { IProjectDef, IProjectTarget, IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef, Project } from './project';
import { IStream } from './stream';
import { ITarget } from './target';
import { AwaitableContainer, iter, iterComplex } from './utils';
import { EntitiesService } from './entities.service';
import { AwaitedCache } from './cache';
import { ProjectState } from './project-state';
import { StatisticsService } from './statistics.service';
import moment from 'moment-timezone';
import {logger} from './logger';

@Service()
export class ProjectsService extends EntitiesService<Project> {
  @Inject(() => StatisticsService) protected statisticsService: StatisticsService;

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
    const flow = project.getFlowByFlowId(flowId);

    for (const [ , aId ] of iter(actionId)) {
      project.validateParams(flowId, aId, params);

      for (const action of flow.actions[aId].steps) {
        logger.info({
          message: 'flowActionRun',
          action: { id: action.type },
          flow: { id: flow.id },
          params,
          targetsStreams,
        });

        try {
          await project.env.actions.get(action.type).run(action, targetsStreams, params);
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

  async getState(
    projectId: IProjectDef['id'],
    targetStreams?: Record<IProjectTarget['id'], IProjectTargetStream['id'][] | boolean>,
    scopes?: Record<string, boolean>,
  ): Promise<ProjectState> {
    const project = this.get(projectId);
    const projectState = await this.statesCache.get(projectId) ?? new ProjectState(projectId);

    if (!scopes) {
      const replaceDirtyTargetIds = projectState.getDirtyTargetIds();

      if (!replaceDirtyTargetIds.length) {
        if (this.statesCache.has(projectId)) {
          return this.statesCache.get(projectId);
        }
      } else {
        if (!targetStreams) {
          targetStreams = {};
        }

        for (const tId of replaceDirtyTargetIds) {
          if (!targetStreams[tId]) {
            targetStreams[tId] = true;
          }
        }
      }
    }

    return this.statesCache.set(projectId, (async () => {
      const targetContainer = new AwaitableContainer(1);
  
      for (const [ ,tId ] of iter(targetStreams ? Object.keys(targetStreams) : Object.keys(project.targets))) {
        const target = project.getTargetByTargetId(tId);
  
        await targetContainer.push(async () => {
          projectState.setTarget(tId, {
            version: await project.env.versionings.getByTarget(target).getCurrent(target),
          })
  
          const replaceDirtyStreamIds = projectState.getDirtyTargetStreamIds(tId);
          const streamContainer = new AwaitableContainer(1);

          for (const stream of Object.values(target.streams)) {
            if (
              !scopes &&
              (
                !replaceDirtyStreamIds.length ||
                !replaceDirtyStreamIds.includes(stream.id)
              )
            ) {
              continue;
            }

            if (targetStreams) {
              if (
                Array.isArray(targetStreams?.[tId]) &&
                !(targetStreams?.[tId] as IProjectTargetStream['id'][])?.includes(stream.id)
              ) {
                continue;
              }

              if (!targetStreams[tId]) {
                continue;
              }
            }

            await streamContainer.push(async () => {
              projectState.setTargetStream(tId, await this.streamGetState(stream, scopes));
            });
          }

          await streamContainer.wait();
        });
      }
  
      await targetContainer.wait();
  
      return projectState;
    })(), 3600, true);
  }

  async runStatesResync() {
    const now = moment();
    let resynced;

    for (const project of Object.values(this.entities)) {
      if (
        project.resync?.intervalSeconds &&
        now.diff(project.resync?.at ?? '1970-01-01', 'seconds') < project.resync?.intervalSeconds
      ) {
        continue;
      }

      try {
        await this.getState(project.id, null, { '*': true });

        project.resync.at = now.toDate();
        resynced = true;

        this.statisticsService.inc(`projects.${project.id}.statesResyncCount`);
        this.statisticsService.set(`projects.${project.id}.statesResyncAt`, now.toDate());
      } catch (err) {
        this.statisticsService.add(`projects.${project.id}.errors`, {
          message: err?.message ?? err ?? null,
          time: new Date(),
          type: 'projectState:resync',
        });
      }
    }

    if (resynced) {
      this.statisticsService.inc('general.statesResyncCount');
      this.statisticsService.set('general.statesResyncAt', new Date());
    }

    setTimeout(() => this.runStatesResync(), 30000);
  }

  streamGetState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>): Promise<IStream>;

  streamGetState(projectId: string, targetId: string, streamId: string, scopes?: Record<string, boolean>): Promise<IStream>;

  async streamGetState(mixed: string | IProjectTargetStreamDef, targetId?: string | Record<string, boolean>, streamId?: string, scopes?: Record<string, boolean>) {
    const project = this.get(typeof mixed === 'string' ? mixed : mixed.ref?.projectId);
    const streamState = project.env.streams.getState(
      typeof mixed === 'string'
        ? project.getTargetStreamByTargetIdAndStreamId(targetId as string, streamId)
        : mixed,
      typeof mixed === 'string'
        ? scopes
        : targetId as Record<string, boolean>,
    );

    return streamState;
  }

  targetGetState(stream: IProjectTargetDef): Promise<ITarget>;

  targetGetState(projectId: string, targetId: string): Promise<ITarget>;

  async targetGetState(mixed: string | IProjectTargetDef, targetId?: string) {
    const project = this.get(typeof mixed === 'string' ? mixed : mixed.ref?.projectId);
    const targetState = project.env.targets.getState(
      typeof mixed === 'string'
        ? project.getTargetByTargetId(targetId)
        : mixed
    );

    return targetState;
  }
}
