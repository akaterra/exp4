import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectFlowActionStep, IProjectFlowActionStepDef, IProjectFlowDef, IProjectTarget, IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import {ArgocdIntegrationService} from '../integrations/argocd';
import {notEmptyArray} from './utils';

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

  async run(
    flow: IProjectFlowDef,
    action: IProjectFlowActionDef,
    step: IProjectFlowActionStep<IArgocdSyncStepConfig>,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
    const project = this.projectsService.get(action.ref.projectId);

    for (const tIdOfTarget of notEmptyArray(step.targets, flow.targets)) {
      const target = project.getTargetByTargetId(tIdOfTarget);
      const streamIds = targetsStreams?.[tIdOfTarget] === true
        ? Object.keys(target.streams)
        : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

      for (const streamId of streamIds) {
        const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);

        await project.getEnvIntegraionByIntegrationId<ArgocdIntegrationService>(step.config?.integration, 'argocd').syncResource(
          targetStream.config?.argocdServiceName
            ? {
              resourceName: targetStream.config?.argocdServiceName as any,
              resourceKind: targetStream.config?.argocdServiceKind as any ?? 'StatefulSet'
            }
            : {
              resourceNameIn: targetStream.config?.argocdServiceNameIn as any ?? targetStream.id as any,
              resourceKind: targetStream.config?.argocdServiceKind as any ?? 'StatefulSet'
            },
          );

        targetStream.isDirty = true;
      }

      target.isDirty = true;
    }
  }
}
