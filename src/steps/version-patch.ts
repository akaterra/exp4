import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectFlowActionStepDef, IProjectFlowDef, IProjectTarget, IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { Autowired, iter } from '../utils';
import { EntityService } from '../entities.service';

@Service()
export class VersionPatchStepService extends EntityService implements IStepService {
  static readonly type = 'version:patch';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectFlowActionDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : step.targets)) {
      const target = project.getTargetByTargetId(tId);

      await project.getEnvVersioningByTarget(target).patch(target, params);

      target.isDirty = true;
    }
  }
}
