import { Inject, Service } from 'typedi';
import { IProjectTargetDef } from './project';
import { AwaitedCache } from './cache';
import { ProjectsService } from './projects.service';
import { VersioningsService } from './versionings.service';
import { ITarget } from './target';

@Service()
export class TargetsService {
  @Inject(() => ProjectsService) protected projectsService: ProjectsService;
  @Inject(() => VersioningsService) protected versioningsService: VersioningsService;
  protected cache = new AwaitedCache<ITarget>();

  get domain() {
    return 'Target';
  }

  async getState(target: IProjectTargetDef) {
    const key = `${target.ref.projectId}:${target.id}`;
    const entity = await this.cache.get(key) ?? { id: target.id, type: null };

    if (entity) {
      const versioning = this.projectsService.get(target.ref.projectId).getTargetVersioning(target.id);

      entity.version = await this.versioningsService.get(versioning).getCurrent(
        this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.id),
      );
    }

    this.cache.set(key, entity, 60);

    return entity;
  }
}
