import { Inject, Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef, Project } from './project';
import { AwaitableContainer, iter } from './utils';
import { EntitiesService } from './entities.service';
import { AwaitedCache } from './cache';
import { ProjectState } from './project-state';
import { StatisticsService } from './statistics.service';
import moment from 'moment-timezone';
import { Log, logger } from './logger';
import { TargetState } from './target-state';

@Service()
export class ProjectsService extends EntitiesService<Project> {
  @Inject(() => StatisticsService) protected statisticsService: StatisticsService;

  private statesCache = new AwaitedCache<ProjectState>();
  private tasksContainer = new AwaitableContainer(2);

  get domain() {
    return 'Project';
  }

  list() {
    return this.entities;
  }

  @Log('debug')
  async rereadState(
    projectId: IProjectDef['id'],
    targetStreams?: Record<IProjectTargetDef['id'], IProjectTargetStreamDef['id'][] | boolean>,
    scopes?: Record<string, boolean>,
  ): Promise<ProjectState> {
    const project = this.get(projectId);
    const projectState =
      await this.statesCache.get(projectId) ??
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
      const target = project.getTargetByTarget(tId);
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
        let syncEntries;

        do {
          syncEntries = projectState.popTargetSync(100);

          for (const [ tId, ] of syncEntries) {
            this.tasksContainer.onGroup('streamState').async.push(async () => {
              await project.rereadTargetStateByTarget(tId);
            });
          }

          await this.tasksContainer.onGroup('streamState').wait();


          for (const [ tId, streamIds, scopes ] of syncEntries) {
            for (const sId of streamIds) {
              const stream = project.getTargetStreamByTargetAndStream(tId, sId, true);

              if (stream) {
                this.tasksContainer.onGroup('streamState').async.push(async () => {
                  const streamState = await project.rereadcStreamStateByTargetAndStream(tId, sId, scopes);

                  projectState.getTargetState(tId).setReleaseSectionByStreamId(
                    sId,
                    streamState.history.artifact,
                    null,
                    true,
                  );
                });
              }
            }
          }

          await this.tasksContainer.onGroup('streamState').wait();

          for (const [ tId, ] of syncEntries) {
            this.tasksContainer.onGroup('streamState').async.push(async () => {
              await project.updateTargetState(tId);
            });
          }

          await this.tasksContainer.onGroup('streamState').wait();
        } while (syncEntries.length);
      })();
    }

    project.state = projectState;

    return projectState;
  }

  async updateTargetState(targetState: TargetState) {
    await this.tasksContainer.async.push(async () => {
      await this.get(targetState.target.ref.projectId)
        .getEnvVersioningByTarget(targetState.target)
        .setCurrentRelease(targetState);

      targetState.release.ver += 1;
    });
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

        await this.rereadState(project.id, null, { '*': true });

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
}
