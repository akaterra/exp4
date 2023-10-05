import { Service } from 'typedi';
import { IProjectFlowActionStep, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { makeDirty, notEmptyArray } from './utils';
import { JenkinsIntegrationService } from '../integrations/jenkins';
import * as _ from 'lodash';

export interface IJenkinsJobRunStepConfig extends Record<string, unknown> {
  integration: string;
  jobName?: string;
  jobParams?: Record<string, unknown>;
  jobParamsList?: string[];
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
    const projectState = await this.projectsService.getState(flow.ref.projectId);

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

        let useParams = params ?? this.getStreamConfig(targetStream, flow)?.jobParams ?? targetStream.config?.jenkinsJobParams;

        if (this.config?.jobParams) {
          useParams = { ...this.config?.jobParams, ...useParams };
        }
console.log(useParams, this.config);
        if (this.config?.jobParamsList?.length) {
          useParams = _.pick(useParams, this.config.jobParamsList);
        }
        console.log(useParams);

        if (useParams) {
          useParams = _.mapValues(useParams, (val) => rep(val));
        }
        console.log(useParams);

        context.params = useParams;

        await project.getEnvIntegraionByIntegrationId<JenkinsIntegrationService>(
          rep(step.config?.integration ?? 'jenkins'),
          'jenkins',
        ).runJob(
          rep(this.getStreamConfig(targetStream, flow)?.jobName ?? targetStream.config?.jenkinsJobName ?? this.config?.jobName),
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

