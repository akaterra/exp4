import { Service } from 'typedi';
import { IProjectActionDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, markDirty } from './utils';

@Service()
export class StreamVersionOverrideActionService extends EntityService implements IActionService {
  static readonly type = 'streamVersion:override';

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

        const source = project.getTargetByTarget(tIdOfSource);
        const target = project.getTargetByTarget(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfSource] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? Object.keys(target.streams);

        for (const sId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetAndStream(tIdOfSource, sId);
          const targetStream = project.getTargetStreamByTargetAndStream(tIdOfTarget, sId);

          await project
            .getEnvVersioningByTarget(target)
            .overrideStream(source, targetStream);

          markDirty(sourceStream, targetStream);
        }

        markDirty(source, target);
      }
    }
  }
}
