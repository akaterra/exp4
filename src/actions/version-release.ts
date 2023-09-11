import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectTarget, IProjectTargetStream } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { Autowired, iter } from '../utils';
import { EntityService } from '../entities.service';

@Service()
export class VersionReleaseActionService extends EntityService implements IActionService {
  @Autowired() protected projectsService: ProjectsService;

  get type() {
    return 'version:release';
  }

  async run(
    action: IProjectFlowActionDef,
    targetsStreams?: Record<IProjectTarget['id'], [ IProjectTargetStream['id'], ...IProjectTargetStream['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : action.targets)) {
      const target = project.getTargetByTargetId(tId);

      await project.getEnvVersioningByTarget(target).release(target, params);

      target.isDirty = true;
    }
  }
}
