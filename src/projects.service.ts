import { Inject, Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef, Project } from './project';
import { StreamState } from './stream';
import { TargetState } from './target';
import { AwaitableContainer, iter } from './utils';
import { EntitiesService } from './entities.service';
import { AwaitedCache } from './cache';
import { ProjectState } from './project-state';
import { StatisticsService } from './statistics.service';
import moment from 'moment-timezone';
import { Log, logger } from './logger';

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

  async flowRun(
    projectId: string,
    flowId: string | string[],
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ) {
    const project = this.get(projectId);

    for (const [ , fId ] of iter(flowId)) {
      const flow = project.getFlowByFlowId(fId);

      project.env.validator.validate(params, fId);

      for (const step of flow.steps) {
        logger.info({
          message: 'flowStepRun',
          ref: step.ref,
          params,
          targetsStreams,
        });

        try {
          await project.env.steps.get(step.type).run(flow, step, targetsStreams, params);
        } catch (err) {
          this.statisticsService.add(`projects.${projectId}.errors`, {
            message: err?.message ?? err ?? null,
            time: new Date(),
            type: 'projectFlow:run',
          });

          throw err;
        }
      }
    }

    return true;
  }

  @Log('debug')
  async getState(
    projectId: IProjectDef['id'],
    targetStreams?: Record<IProjectTargetDef['id'], IProjectTargetStreamDef['id'][] | boolean>,
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
          const context = {
            ver: Date.now(),
          };

          projectState.setTarget(tId, {
            version: await project.env.versionings.getByTarget(target).getCurrent(target),
          })
  
          const streamContainer = new AwaitableContainer(1);
          const streamIds: IProjectTargetStreamDef['id'][] = targetStreams?.[tId]
            ? targetStreams[tId] === true
              ? Object.keys(target.streams)
              : targetStreams[tId] as IProjectTargetStreamDef['id'][]
            : scopes
              ? Object.keys(target.streams)
              : projectState.getDirtyTargetStreamIds(tId);

          for (const sId of streamIds) {
            const stream = project.getTargetStreamByTargetIdAndStreamId(tId, sId, true);

            if (stream) {
              await streamContainer.push(async () => {
                projectState.setTargetStream(tId, await this.streamGetState(stream, scopes, context));
              });
            }
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

  streamGetState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>, context?: Record<string, unknown>): Promise<StreamState>;

  streamGetState(projectId: string, targetId: string, streamId: string, scopes?: Record<string, boolean>, context?: Record<string, unknown>): Promise<StreamState>;

  async streamGetState(
    mixed: IProjectDef['id'] | IProjectTargetStreamDef,
    targetId?: IProjectTargetDef['id'] | Record<string, boolean>,
    streamId?: IProjectTargetStreamDef['id'] | Record<string, unknown>,
    scopes?: Record<string, boolean>,
    context?: Record<string, unknown>,
  ) {
    const project = this.get(typeof mixed === 'string' ? mixed : mixed.ref?.projectId);
    const streamState = project.env.streams.getState(
      typeof mixed === 'string'
        ? project.getTargetStreamByTargetIdAndStreamId(targetId as IProjectTargetDef['id'], streamId as IProjectTargetStreamDef['id'])
        : mixed,
      typeof mixed === 'string'
        ? scopes
        : targetId as Record<string, boolean>,
      typeof mixed === 'string'
        ? context
        : streamId as Record<string, unknown>,
    );

    return streamState;
  }

  targetGetState(stream: IProjectTargetDef): Promise<TargetState>;

  targetGetState(projectId: string, targetId: string): Promise<TargetState>;

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
