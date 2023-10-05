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
  jobName?: string;
  params?: Record<string, unknown>;
  paramsList?: string[];
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

      if (Object.keys(params).length === 0) {
        params = null;
      }

      for (const streamId of streamIds) {
        const targetStream = project.getTargetStreamByTargetIdAndStreamId(tIdOfTarget, streamId);
        let useParams = params ?? this.getStreamConfig(targetStream, flow)?.jobParams ?? targetStream.config?.jenkinsParams;

        if (this.config?.params) {
          useParams = { ...this.config?.params, ...useParams };
        }

        if (this.config?.paramsList?.length) {
          useParams = _.pick(useParams, this.config.paramsList);
        }

        await project.getEnvIntegraionByIntegrationId<JenkinsIntegrationService>(step.config?.integration, 'jenkins').runJob(
          this.getStreamConfig(targetStream, flow)?.jobName ?? targetStream.config?.jenkinsJobName ?? this.config?.jobName,
          useParams,
        );

        makeDirty(targetStream);
      }

      makeDirty(target);
    }
  }

  private getStreamConfig(stream, flow) {
    return stream.config?.jenkins?.flows?.[flow.id] ?? stream.config?.jenkins as any;
  }
}
