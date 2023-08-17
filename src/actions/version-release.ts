import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { iter } from '../utils';
import { EntityService } from '../entities.service';
import { VersioningsService } from '../versionings.service';

@Service()
export class VersionReleaseActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;
  @Inject() protected versioningsService: VersioningsService;

  get type() {
    return 'version:release';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : action.targets)) {
      const target = project.getTargetByTargetId(tId);

      await this.versioningsService.getByTarget(target).release(target);
    }
  }
}
