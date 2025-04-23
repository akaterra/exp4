import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, markDirty } from './utils';
import { StreamServiceStreamMoveOptsStrategy } from '../streams';

@Service()
export class MoveActionService extends EntityService implements IActionService {
  static readonly type = 'move';

  @Autowired() protected projectsService: ProjectsService;

  description = 'Moves selected streams between targets';

  async run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds = getPossibleTargetIds(targetsStreams, project.getFlowByFlowId(flow.ref.flowId).targets);

    for (let tIdOfSource of sourceTargetIds) {
      for (let tIdOfTarget of action.targets) {
        const [ sId, tId ] = tIdOfTarget.split(':');

        if (tId) {
          tIdOfSource = sId;
          tIdOfTarget = tId;
        }

        project.getTargetByTargetId(tIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfSource] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? Object.keys(target.streams);

        for (const sId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfSource, sId, true);
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, sId, true);

          if (sourceStream && targetStream) {
            await project.getEnvStreamByTargetStream(targetStream)
              .streamMove(
                targetStream,
                sourceStream,
                {
                  strategy: action.config?.strategy as StreamServiceStreamMoveOptsStrategy,
                },
              );

            markDirty(sourceStream, targetStream);
          }
        }
      }
    }
  }
}
