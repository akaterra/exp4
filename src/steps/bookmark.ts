import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectTarget, IProjectTargetStream } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class BookmarkStepService extends EntityService implements IStepService {
  @Autowired() protected projectsService: ProjectsService;

  get type() {
    return 'bookmark';
  }

  async run(
    action: IProjectFlowActionDef,
    targetsStreams?: Record<IProjectTarget['id'], [ IProjectTargetStream['id'], ...IProjectTargetStream['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);
    const sourceTargetIds: IProjectTarget['id'][] = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlowByFlowId(action.ref.flowId).targets;

    for (const tIdOfSource of sourceTargetIds) {
      for (const tIdOfTarget of action.targets) {
        const source = project.getTargetByTargetId(tIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfSource] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? Object.keys(target.streams);

        for (const streamId of streamIds) {
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId, true);

          if (targetStream) {
            await project.getEnvStreamByTargetStream(targetStream).streamBookmark(
              targetStream,
            );

            targetStream.isDirty = true;
          }
        }

        source.isDirty = true;
        target.isDirty = true;
      }
    }
  }
}
