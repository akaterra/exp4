import { Service } from 'typedi';
import { IProjectFlowActionStepDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { makeDirty } from './utils';

@Service()
export class DetachStepService extends EntityService implements IStepService {
  static readonly type = 'detach';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    // action: IProjectFlowActionDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlowByFlowId(flow.ref.flowId).targets;

    for (const tIdOfSource of sourceTargetIds) {
      for (const tIdOfTarget of step.targets) {
        const source = project.getTargetByTargetId(tIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfSource] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? Object.keys(target.streams);

        for (const streamId of streamIds) {
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId, true);

          if (targetStream) {
            await project.getEnvStreamByTargetStream(targetStream).streamDetach(
              targetStream,
            );

            makeDirty(targetStream);
          }
        }

        makeDirty(source, target);
      }
    }
  }
}
