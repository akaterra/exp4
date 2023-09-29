import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectFlowActionStepDef, IProjectFlowDef, IProjectTarget, IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { Autowired, iter } from '../utils';
import { EntityService } from '../entities.service';

@Service()
export class VersionReleaseStepService extends EntityService implements IStepService {
  static readonly type = 'version:release';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectFlowActionDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
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
