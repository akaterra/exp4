import { Service } from 'typedi';
import { IProjectTargetDef } from '../project';
import { AwaitedCache, Mutex } from '../cache';
import { ProjectsService } from '../projects.service';
import { Autowired, CallbacksContainer } from '../utils';
import { TargetState } from '../target-state';

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
      const entity = await this.cache.get(key) ?? new TargetState({ id: target.id, type: null, target });

      if (!entity) {
        return null;
      }

      await this.callbacksContainer.run('targetState:reread', { target, targetState: entity });

      // if (project.getReleaseByTarget(target)) {
      //   const release = await project.getEnvVersioningByTarget(target).getCurrentRelease(target);

      //   if (!entity.release || (release && release.ver > entity.release.ver)) {
      //     entity.release = release;
      //   }

      //   entity.release.schema = project.getReleaseByTarget(target);
      // }

      entity.version = await project.getEnvVersioningByTarget(target).getCurrent(target);

      this.cache.set(key, entity);

      return entity;
    } finally {
      release();
    }
  }
}
