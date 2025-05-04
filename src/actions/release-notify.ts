import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, notEmptyArray } from './utils';

@Service()
export class ReleaseNotifyActionService extends EntityService implements IActionService {
  static readonly type = 'release:notify';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds: IProjectTargetDef['id'][] = notEmptyArray(
      action.targets,
      getPossibleTargetIds(targetsStreams, project.getFlowByFlow(flow.ref.flowId).targets),
    );

    for (const tIdOfTarget of sourceTargetIds) {
      const targetState = await project.rereadTargetStateByTarget(tIdOfTarget);

      await project
        .getEnvNotificationByNotification(action.config?.notification)
        .publishRelease(targetState);
    }
  }
}
