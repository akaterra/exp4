import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';

@Service()
export class DetachActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;

  get type() {
    return 'detach';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlowByFlowId(action.ref.flowId).targets;

    for (const sIdOfSource of sourceTargetIds) {
      for (const tIdOfTarget of action.targets) {
        const source = project.getTargetByTargetId(sIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfTarget] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

        for (const streamId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetIdAndStreamId(sIdOfSource, streamId);
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);

          await project.getEnvStreamByTargetStream(targetStream).streamDetach(
            targetStream,
          );

          sourceStream.isDirty = true;
          targetStream.isDirty = true;
        }

        source.isDirty = true;
        target.isDirty = true;
      }
    }
  }
}
