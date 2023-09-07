import { Service } from 'typedi';
import { IProjectTargetDef } from './project';
import { AwaitedCache } from './cache';
import { ProjectsService } from './projects.service';
import { ITarget } from './target';
import { Autowired } from './utils';

@Service()
export class TargetsService {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<ITarget>();

  get domain() {
    return 'Target';
  }

  async getState(target: IProjectTargetDef) {
    const key = `${target.ref.projectId}:${target.id}`;
    const entity = await this.cache.get(key) ?? { id: target.id, type: null };

    if (entity) {
      entity.version = await this.getVersioningsService(target).getCurrent(
        this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.id),
      );
    }

    this.cache.set(key, entity, 60);

    return entity;
  }

  private getVersioningsService(target: IProjectTargetDef) {
    return this.projectsService
      .get(target.ref?.projectId)
      .getEnvVersioningByVersioningId(target.versioning);
  }
}
