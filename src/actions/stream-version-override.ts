import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class StreamVersionOverrideActionService extends EntityService implements IActionService {
  @Autowired() protected projectsService: ProjectsService;

  get type() {
    return 'streamVersion:override';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlowByFlowId(action.ref.flowId).targets;

    for (let sIdOfSource of sourceTargetIds) {
      for (let tIdOfTarget of action.targets) {
        const [ sId, tId ] = tIdOfTarget.split(':');

        if (tId) {
          sIdOfSource = sId;
          tIdOfTarget = tId;
        }

        const source = project.getTargetByTargetId(sIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);
        const streamIds = targetsStreams?.[tIdOfTarget] === true
          ? Object.keys(target.streams)
          : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

        for (const streamId of streamIds) {
          const sourceStream = project.getTargetStreamByTargetIdAndStreamId(sIdOfSource, streamId);
          const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);

          await project.getEnvVersioningByTarget(target).overrideStream(
            source,
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
