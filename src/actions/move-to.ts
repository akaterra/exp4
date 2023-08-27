import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';

@Service()
export class MoveToActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;

  get type() {
    return 'moveTo';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlow(action.ref.flowId).targets;

    for (const tIdOfSource of sourceTargetIds) {
      const streamIds = targetsStreams
        ? targetsStreams?.[tIdOfSource] === true
          ? Object.keys(project.getTargetByTargetId(tIdOfSource).streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? []
        : Object.keys(project.getTargetByTargetId(tIdOfSource).streams);

      for (const tIdOfTarget of action.targets) {
        for (const sId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfSource, sId, true);
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, sId, true);

          if (sourceStream && targetStream) {
            await project.getStreamByTargetStream(sourceStream)
              .streamMove(sourceStream, targetStream);
          }

          sourceStream.isDirty = true;
          targetStream.isDirty = true;
        }
      }
    }
  }
}
