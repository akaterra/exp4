import { Inject, Service } from 'typedi';
import { IProjectTarget, IProjectTargetDef } from './project';
import { Cache } from './cache';
import { ProjectsService } from './projects.service';
import { VersioningsService } from './versionings.service';
import { ITarget } from './target';

@Service()
export class TargetsService {
  @Inject(() => ProjectsService) protected projectsService: ProjectsService;
  @Inject(() => VersioningsService) protected versioningsService: VersioningsService;
  protected cache = new Cache<ITarget>();

  get domain() {
    return 'Target';
  }

  async getState(ref: IProjectTargetDef) {
    const key = `${ref.projectId}:${ref.id}`;
    const entity = this.cache.get(key) ?? { id: ref.id, type: null };

    if (entity) {
      const versioning = this.projectsService.get(ref.projectId).getTargetVersioning(ref.id);

      entity.version = await this.versioningsService.get(versioning).getCurrent(
        this.projectsService.get(ref.projectId).getTargetByTargetId(ref.id),
      );
    }

    this.cache.set(key, entity, 60);

    return entity;
  }
}
