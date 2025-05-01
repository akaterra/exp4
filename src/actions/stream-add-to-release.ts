import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, markDirty, notEmptyArray } from './utils';

@Service()
export class StreamAddToReleaseActionService extends EntityService implements IActionService {
  static readonly type = 'stream:addToRelease';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds = getPossibleTargetIds(targetsStreams, project.getFlowByFlow(flow.ref.flowId).targets);

    for (let tIdOfSource of sourceTargetIds) {
      for (let tIdOfTarget of action.targets) {
        const [ sId, tId ] = tIdOfTarget.split(':');

        if (tId) {
          tIdOfSource = sId;
          tIdOfTarget = tId;
        }

        const target = project.getTargetByTarget(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfSource] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? Object.keys(target.streams);
        const targetState = await project.getTargetStateByTarget(tIdOfTarget);

        for (const streamId of streamIds) {
          const targetStreamState = await project.getStreamStateByTargetAndStream(tIdOfTarget, streamId);
          targetState.setReleaseSectionByStreamId(streamId, targetStreamState.history.artifact);
        }

        await project.updateTargetState(target);
      }
    }
  }
}
