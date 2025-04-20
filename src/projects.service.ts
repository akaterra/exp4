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

      if (!flow) {
        continue;
      }

      project.env.validator.validate(params, fId);

      for (const step of flow.actions) {
        logger.info({
          message: 'flowStepRun',
          ref: step.ref,
          params,
          targetsStreams,
        });

        try {
          await project.env.actions.get(step.type).run(flow, step, targetsStreams, params);
        } catch (err) {
          this.statisticsService.add(`projects.${projectId}.errors`, {
            message: err?.message ?? err ?? null,
            time: new Date(),
            type: 'projectFlow:run',
          });

          if (
            !step.bypassErrorCodes ||
            (
              !step.bypassErrorCodes.includes(err?.cause) &&
              !step.bypassErrorCodes.includes('*')
            )
          ) {
            throw err;
          }
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
    const projectState = await this.statesCache.get(projectId) ??
      await this.statesCache.set(projectId, new ProjectState(projectId));

    if (!scopes) {
      const replaceDirtyTargetIds = projectState.getDirtyTargetIds();

      if (replaceDirtyTargetIds.length) {
        if (!targetStreams) {
          targetStreams = {};
        }

        for (const tId of replaceDirtyTargetIds) {
          const replaceDirtyTargetStreamIds = projectState.getDirtyTargetStreamIds(tId);

          if (!targetStreams[tId]) {
            targetStreams[tId] = replaceDirtyTargetStreamIds;
          } else if (Array.isArray(targetStreams[tId])) {
            targetStreams[tId] = [ ...new Set((targetStreams[tId] as string[]).concat(replaceDirtyTargetStreamIds)) ];
          }
        }
      }

      if (!targetStreams) {
        return projectState;
      }
    }

    const isSyncing = projectState.isSyncing;

    for (const [ ,tId ] of iter(targetStreams ? Object.keys(targetStreams) : Object.keys(project.targets))) {
      const target = project.getTargetByTargetId(tId);
      const streamIds: IProjectTargetStreamDef['id'][] = targetStreams?.[tId]
        ? targetStreams[tId] === true
          ? Object.keys(target.streams)
          : targetStreams[tId] as IProjectTargetStreamDef['id'][]
        : scopes
          ? Object.keys(target.streams)
          : projectState.getDirtyTargetStreamIds(tId);

      projectState.addTargetSync(tId, streamIds, scopes);
    }

    if (!isSyncing) {
      (async () => {
        const context = {
          ver: Date.now(),
        };
        const streamContainer = new AwaitableContainer(2);

        let syncEntries;

        do {
          syncEntries = projectState.popTargetSync(100);

          for (const [ tId, streamIds, scopes ] of syncEntries) {
            projectState.setTarget(tId, await this.targetGetState(projectId, tId));

            for (const sId of streamIds) {
              const stream = project.getTargetStreamByTargetIdAndStreamId(tId, sId, true);

              if (stream) {
                await streamContainer.push(async () => {
                  projectState.setTargetStream(tId, await this.streamGetState(stream, scopes, context));
                });
              }
            }
          }

          await streamContainer.wait();
        } while (syncEntries.length);
      })();
    }

    return projectState;
  }

  async runStatesResync() {
    const now = moment();
    let resynced;

    for (const project of Object.values(this.entities)) {
      const secondsLeftToResync = project.resync?.intervalSeconds
        ? project.resync?.intervalSeconds - now.diff(project.resync?.at ?? '1970-01-01', 'seconds')
        : 0;

      logger.info({
        message: 'ProjectsService.runStatesResync',
        projectId: project.id,
        secondsLeftToResync: secondsLeftToResync > 0 ? secondsLeftToResync : 0,
      })

      if (secondsLeftToResync > 0) {
        continue;
      }

      try {
        project.resync.at = now.toDate();
        resynced = true;

        await this.getState(project.id, null, { '*': true });

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
