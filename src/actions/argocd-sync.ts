import { Service } from 'typedi';
import { IProjectAction, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { ArgocdIntegrationService } from '../integrations/argocd';
import { getPossibleTargetIds, markDirty, notEmptyArray } from './utils';
import { Log } from '../logger';

export interface IArgocdSyncStepConfig extends Record<string, unknown> {
  integration: string;
}

@Service()
export class ArgocdSyncActionService extends EntityService implements IActionService {
  static readonly type = 'argocd:sync';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: IArgocdSyncStepConfig) {
    super();
  }

  @Log('debug')
  async exec(
    flow: IProjectFlowDef,
    action: IProjectAction<IArgocdSyncStepConfig>,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const projectState = await this.projectsService.rereadState(flow.ref.projectId);
    const sourceTargetIds = notEmptyArray(
      action.targets,
      getPossibleTargetIds(targetsStreams, project.getFlowByFlow(flow.ref.flowId).targets),
    );

    for (const tIdOfTarget of sourceTargetIds) {
      const target = project.getTargetByTarget(tIdOfTarget);
      const streamIds = targetsStreams?.[tIdOfTarget] === true
        ? Object.keys(target.streams)
        : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

      for (const streamId of streamIds) {
        const targetStream = project.getTargetStreamByTargetAndStream(tIdOfTarget, streamId);
        const context: Record<string, unknown> = {
          stream: targetStream,
          streamState: projectState.targetsStates?.[tIdOfTarget]?.streams?.[streamId],
          target,
        };

        function rep(val) {
          if (Array.isArray(val)) {
            return val.map((val) => resolvePlaceholders(val, context));
          }

          return resolvePlaceholders(val, context);
        }

        await project.getEnvIntegraionByIntegration<ArgocdIntegrationService>(
          rep(action.config?.integration ?? 'argocd'),
          'argocd',
        ).withContext(context).resourceSync(
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

        markDirty(targetStream);
      }

      markDirty(target);
    }
  }

  private getStreamConfig(stream, flow) {
    return stream.config?.argocd?.flows?.[flow.id] ?? stream.config?.argocd as any;
  }
}
