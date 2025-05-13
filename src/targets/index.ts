import { Service } from 'typedi';
import { IProjectTargetDef } from '../project';
import { AwaitedCache, Mutex } from '../cache';
import { ProjectsService } from '../projects.service';
import { Autowired, CallbacksContainer } from '../utils';
import { TargetState } from '../target-state';
import { EVENT_TARGET_STATE_REREAD_STARTED, EVENT_TARGET_STATE_REREAD_FINISHED, EVENT_TARGET_STATE_UPDATE_STARTED, EVENT_TARGET_STATE_UPDATE_FINISHED } from '../const';

@Service()
export class TargetHolderService {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<TargetState>();
  protected mutex = new Mutex();

  get domain() {
    return 'Target';
  }

  constructor(public readonly callbacksContainer: CallbacksContainer = new CallbacksContainer()) {

  }

  async rereadState(target: IProjectTargetDef) {
    const project = this.projectsService.get(target.ref?.projectId);
    const key = `${target.ref.projectId}:${target.id}`;
    const release = await this.mutex.acquire(key);

    try {
      const targetState = await this.cache.get(key) ?? new TargetState({ id: target.id, type: null, target });

      await this.callbacksContainer.run(
        EVENT_TARGET_STATE_REREAD_STARTED,
        { target, targetState },
      );

      // if (project.getReleaseByTarget(target)) {
      //   const release = await project.getEnvVersioningByTarget(target).getCurrentRelease(target);

      //   if (!entity.release || (release && release.ver > entity.release.ver)) {
      //     entity.release = release;
      //   }

      //   entity.release.schema = project.getReleaseByTarget(target);
      // }

      targetState.version = await project.getEnvVersioningByTarget(target).getCurrent(target);

      this.cache.set(key, targetState);

      await this.callbacksContainer.run(
        EVENT_TARGET_STATE_REREAD_FINISHED,
        { target, targetState },
      );

      return targetState;
    } finally {
      release();
    }
  }

  async updateState(targetState: TargetState) {
    // const project = this.projectsService.get(targetState.target.ref?.projectId);
    const key = `${targetState.target.ref.projectId}:${targetState.target.id}`;
    const release = await this.mutex.acquire(key);

    try {
      await this.callbacksContainer.run(
        EVENT_TARGET_STATE_UPDATE_STARTED,
        { target: targetState.target, targetState },
      );

      this.cache.set(key, targetState);

      await this.callbacksContainer.run(
        EVENT_TARGET_STATE_UPDATE_FINISHED,
        { target: targetState.target, targetState },
      );
    } finally {
      release();
    }
  }
}
