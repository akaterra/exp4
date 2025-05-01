import { Service } from 'typedi';
import { IProjectTargetDef } from '../project';
import { AwaitedCache, Mutex } from '../cache';
import { ProjectsService } from '../projects.service';
import { Autowired } from '../utils';
import { TargetState } from '../target-state';

@Service()
export class TargetHolderService {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<TargetState>();
  protected mutex = new Mutex();

  get domain() {
    return 'Target';
  }

  async getState(target: IProjectTargetDef) {
    const project = this.projectsService.get(target.ref?.projectId);
    const key = `${target.ref.projectId}:${target.id}`;
    const release = await this.mutex.acquire(key);

    try {
      const entity = await this.cache.get(key) ?? new TargetState({ id: target.id, type: null, target });

      if (!entity) {
        return null;
      }

      entity.release = await project.getEnvVersioningByTarget(target).getCurrentRelease(target);
      entity.release.schema = target.release;
      entity.version = await project.getEnvVersioningByTarget(target).getCurrent(target);

      this.cache.set(key, entity);

      return entity;
    } finally {
      release();
    }
  }
}
