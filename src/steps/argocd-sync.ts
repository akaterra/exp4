import { Service } from 'typedi';
import { IProjectFlowActionStep, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { ArgocdIntegrationService } from '../integrations/argocd';
import { getPossibleTargetIds, makeDirty, notEmptyArray } from './utils';
import { Log } from '../logger';

export interface IArgocdSyncStepConfig extends Record<string, unknown> {
  integration: string;
}

@Service()
export class ArgocdSyncStepService extends EntityService implements IStepService {
  static readonly type = 'argocd:sync';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: IArgocdSyncStepConfig) {
    super();
  }

  @Log('debug')
  async run(
    flow: IProjectFlowDef,
    step: IProjectFlowActionStep<IArgocdSyncStepConfig>,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const projectState = await this.projectsService.getState(flow.ref.projectId);
    const sourceTargetIds = notEmptyArray(
      step.targets,
      getPossibleTargetIds(targetsStreams, project.getFlowByFlowId(flow.ref.flowId).targets),
    );

    for (const tIdOfTarget of sourceTargetIds) {
      const target = project.getTargetByTargetId(tIdOfTarget);
      const streamIds = targetsStreams?.[tIdOfTarget] === true
        ? Object.keys(target.streams)
        : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

      for (const streamId of streamIds) {
        const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);
        const context: Record<string, unknown> = {
          stream: targetStream,
          streamState: projectState.targets?.[tIdOfTarget]?.streams?.[streamId],
          target,
        };

        function rep(val) {
          if (Array.isArray(val)) {
            return val.map((val) => resolvePlaceholders(val, context));
          }

          return resolvePlaceholders(val, context);
        }

        await project.getEnvIntegraionByIntegrationId<ArgocdIntegrationService>(
          rep(step.config?.integration ?? 'argocd'),
          'argocd',
        ).withContext(context).syncResource(
          this.getStreamConfig(targetStream, flow)?.serviceName ?? targetStream.config?.argocdServiceName
            ? {
              resourceName: this.getStreamConfig(targetStream, flow)?.serviceName ?? targetStream.config?.argocdServiceName as any,
              resourceKind: this.getStreamConfig(targetStream, flow)?.serviceKind ?? targetStream.config?.argocdServiceKind as any ?? 'StatefulSet',
            }
            : {
              resourceNameIn: this.getStreamConfig(targetStream, flow)?.serviceNameIn ?? targetStream.config?.argocdServiceNameIn as any ?? targetStream.id as any,
              resourceKind: this.getStreamConfig(targetStream, flow)?.serviceKind ?? targetStream.config?.argocdServiceKind as any ?? 'StatefulSet',
            },
        );

        makeDirty(targetStream);
      }

      makeDirty(target);
    }
  }

  private getStreamConfig(stream, flow) {
    return stream.config?.argocd?.flows?.[flow.id] ?? stream.config?.argocd as any;
  }
}
