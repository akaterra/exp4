import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { iter } from '../utils';
import { EntityService } from '../entities.service';

@Service()
export class VersionPatchActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;

  get type() {
    return 'version:patch';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : action.targets)) {
      const target = project.getTargetByTargetId(tId);

      await project.getVersioningByTarget(target).patch(target);

      target.isDirty = true;
    }
  }
}
