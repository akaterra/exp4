import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, markDirty } from './utils';

@Service()
export class VersionOverrideActionService extends EntityService implements IActionService {
  static readonly type = 'version:override';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds = getPossibleTargetIds(targetsStreams, project.getFlowByFlow(flow.ref.flowId).targets);

    for (let sIdOfSource of sourceTargetIds) {
      for (let tIdOfTarget of action.targets) {
        const [ sId, tId ] = tIdOfTarget.split(':');

        if (tId) {
          sIdOfSource = sId;
          tIdOfTarget = tId;
        }

        const source = project.getTargetByTarget(sIdOfSource);
        const target = project.getTargetByTarget(tIdOfTarget);

        await project
          .getEnvVersioningByTarget(target)
          .override(source, target);

        markDirty(source, target);
      }
    }
  }
}
