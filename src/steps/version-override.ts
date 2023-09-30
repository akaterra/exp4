import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectFlowActionStepDef, IProjectFlowDef, IProjectTarget, IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class VersionOverrideStepService extends EntityService implements IStepService {
  static readonly type = 'version:override';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectFlowActionDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlowByFlowId(action.ref.flowId).targets;

    for (let sIdOfSource of sourceTargetIds) {
      for (let tIdOfTarget of step.targets) {
        const [ sId, tId ] = tIdOfTarget.split(':');

        if (tId) {
          sIdOfSource = sId;
          tIdOfTarget = tId;
        }

        const source = project.getTargetByTargetId(sIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);

        await project.getEnvVersioningByTarget(target).override(source, target);

        source.isDirty = true;
        target.isDirty = true;
      }
    }
  }
}
