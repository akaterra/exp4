import { Service } from 'typedi';
import { IProjectFlowActionStep, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { makeDirty, notEmptyArray } from './utils';
import { JenkinsIntegrationService } from '../integrations/jenkins';
import * as _ from 'lodash';

export interface IJenkinsJobRunStepConfig extends Record<string, unknown> {
  integration: string;
  parametersList?: string[];
}

@Service()
export class JenkinsJobRunStepService extends EntityService implements IStepService {
  static readonly type = 'jenkins:jobRun';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: IJenkinsJobRunStepConfig) {
    super();
  }

  async run(
    flow: IProjectFlowDef,
    // action: IProjectFlowActionDef,
    step: IProjectFlowActionStep<IJenkinsJobRunStepConfig>,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);

    for (const tIdOfTarget of notEmptyArray(step.targets, flow.targets)) {
      const target = project.getTargetByTargetId(tIdOfTarget);
      const streamIds = targetsStreams?.[tIdOfTarget] === true
        ? Object.keys(target.streams)
        : targetsStreams?.[tIdOfTarget] as string[] ?? Object.keys(target.streams);

      for (const streamId of streamIds) {
        const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);
        let useParams = params ?? targetStream.config?.jenkins?.[flow.id]?.jobParams ?? targetStream.config?.jenkinsParams;

        if (this.config?.parametersList?.length) {
          useParams = _.pick(useParams, this.config.parametersList);
        }

        await project.getEnvIntegraionByIntegrationId<JenkinsIntegrationService>(step.config?.integration, 'jenkins').runJob(
          targetStream.config?.jenkins?.[flow.id]?.jobName ?? targetStream.config?.jenkinsJobName,
          useParams,
        );

        makeDirty(targetStream);
      }

      makeDirty(target);
    }
  }
}
