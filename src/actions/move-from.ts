import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, markDirty as markDirty } from './utils';
import { StreamServiceStreamMoveOptsStrategy } from '../streams';

@Service()
export class MoveFromActionService extends EntityService implements IActionService {
  static readonly type = 'moveFrom';

  @Autowired() protected projectsService: ProjectsService;

  description = 'Moves selected streams between targets';

  async exec(
    flow: IProjectFlowDef,
    step: IProjectActionDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds = getPossibleTargetIds(targetsStreams, project.getFlowByFlow(flow.ref.flowId).targets);

    for (const tIdOfSource of sourceTargetIds) {
      const streamIds = targetsStreams
        ? targetsStreams?.[tIdOfSource] === true
          ? Object.keys(project.getTargetByTarget(tIdOfSource).streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? []
        : Object.keys(project.getTargetByTarget(tIdOfSource).streams);

      for (const tIdOfTarget of step.targets) {
        for (const sId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetAndStream(tIdOfSource, sId, true);
          const targetStream = project.getTargetStreamByTargetAndStream(tIdOfTarget, sId, true);

          if (sourceStream && targetStream) {
            await project.getEnvStreamByTargetStream(targetStream)
              .streamMove(
                targetStream,
                sourceStream,
                {
                  strategy: step.config?.strategy as StreamServiceStreamMoveOptsStrategy,
                }
              );

            markDirty(sourceStream, targetStream);
          }
        }
      }
    }
  }
}
