import { Service } from 'typedi';
import { IProjectFlowActionStepDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { makeDirty, notEmptyArray } from './utils';

@Service()
export class DetachStepService extends EntityService implements IStepService {
  static readonly type = 'detach';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds: IProjectTargetDef['id'][] = targetsStreams
      ? Object.keys(targetsStreams)
      : notEmptyArray(step.targets, project.getFlowByFlowId(flow.ref.flowId).targets);

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

          makeDirty(targetStream);
        }
      }

      makeDirty(target);
    }
  }
}
