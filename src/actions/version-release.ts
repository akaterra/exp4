import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { iter } from '../utils';
import { EntityService } from '../entities.service';

@Service()
export class VersionReleaseActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;

  get type() {
    return 'version:release';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : action.targets)) {
      const target = project.getTargetByTargetId(tId);

      await project.getVersioningByTarget(target).release(target);

      target.isDirty = true;
    }
  }
}
