import { Service } from 'typedi';
import { IProjectFlowActionStepDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { getPossibleTargetIds, makeDirty } from './utils';

@Service()
export class StreamVersionOverrideStepService extends EntityService implements IStepService {
  static readonly type = 'streamVersion:override';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const sourceTargetIds = getPossibleTargetIds(targetsStreams, project.getFlowByFlowId(flow.ref.flowId).targets);

    for (let tIdOfSource of sourceTargetIds) {
      for (let tIdOfTarget of step.targets) {
        const [ sId, tId ] = tIdOfTarget.split(':');

        if (tId) {
          tIdOfSource = sId;
          tIdOfTarget = tId;
        }

        const source = project.getTargetByTargetId(tIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfSource] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfSource] as string[] ?? Object.keys(target.streams);

        for (const streamId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfSource, streamId);
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);

          await project.getEnvVersioningByTarget(target).overrideStream(
            source,
            targetStream,
          );

          makeDirty(sourceStream, targetStream);
        }

        makeDirty(source, target);
      }
    }
  }
}
