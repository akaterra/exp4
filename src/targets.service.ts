import { Service } from 'typedi';
import { IProjectTargetDef } from './project';
import { AwaitedCache } from './cache';
import { ProjectsService } from './projects.service';
import { TargetState } from './target';
import { Autowired } from './utils';

@Service()
export class TargetsService {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<TargetState>();

  get domain() {
    return 'Target';
  }

  async getState(target: IProjectTargetDef) {
    const key = `${target.ref.projectId}:${target.id}`;
    const entity = await this.cache.get(key) ?? new TargetState({ id: target.id, type: null });

    if (entity) {
      entity.version = await this.getVersioningsService(target).getCurrent(
        this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.id),
      );
    }

    this.cache.set(key, entity);

    return entity;
  }

  private getVersioningsService(target: IProjectTargetDef) {
    return this.projectsService
      .get(target.ref?.projectId)
      .getEnvVersioningByVersioningId(target.versioning);
  }
}
