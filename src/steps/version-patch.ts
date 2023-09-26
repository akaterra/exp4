import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectTarget, IProjectTargetStream } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { Autowired, iter } from '../utils';
import { EntityService } from '../entities.service';

@Service()
export class VersionPatchStepService extends EntityService implements IStepService {
  @Autowired() protected projectsService: ProjectsService;

  get type() {
    return 'version:patch';
  }

  async run(
    action: IProjectFlowActionDef,
    targetsStreams?: Record<IProjectTarget['id'], [ IProjectTargetStream['id'], ...IProjectTargetStream['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : action.targets)) {
      const target = project.getTargetByTargetId(tId);

      await project.getEnvVersioningByTarget(target).patch(target, params);

      target.isDirty = true;
    }
  }
}
