import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectTarget, IProjectTargetStream } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class MoveFromStepService extends EntityService implements IStepService {
  @Autowired() protected projectsService: ProjectsService;

  description = 'Moves selected streams between targets';

  get type() {
    return 'moveFrom';
  }

  async run(
    action: IProjectFlowActionDef,
    targetsStreams?: Record<IProjectTarget['id'], [ IProjectTargetStream['id'], ...IProjectTargetStream['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlowByFlowId(action.ref.flowId).targets;

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
            await project.getEnvStreamByTargetStream(targetStream)
              .streamMove(targetStream, sourceStream);

            sourceStream.isDirty = true;
            targetStream.isDirty = true;
          }
        }
      }
    }
  }
}