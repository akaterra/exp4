import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, markDirty, notEmptyArray } from './utils';

@Service()
export class DetachActionService extends EntityService implements IActionService {
  static readonly type = 'detach';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds: IProjectTargetDef['id'][] = notEmptyArray(
      action.targets,
      getPossibleTargetIds(targetsStreams, project.getFlowByFlowId(flow.ref.flowId).targets),
    );

    for (const tIdOfTarget of sourceTargetIds) {
      const target = project.getTargetByTargetId(tIdOfTarget);
      const streamIds = targetsStreams?.[tIdOfTarget] === true
        ? Object.keys(target.streams)
        : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

      for (const streamId of streamIds) {
        const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId, true);

        if (targetStream) {
          await project.getEnvStreamByTargetStream(targetStream).streamDetach(
            targetStream,
          );

          markDirty(targetStream);
        }
      }

      markDirty(target);
    }
  }
}
