import { Service } from 'typedi';
import { IProjectFlowActionStep, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { makeDirty, notEmptyArray } from './utils';
import { JenkinsIntegrationService } from '../integrations/jenkins';
import * as _ from 'lodash';
import { Log } from '../logger';

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

  @Log('debug')
  async run(
    flow: IProjectFlowDef,
    step: IProjectFlowActionStep<IJenkinsJobRunStepConfig>,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const projectState = await this.projectsService.getState(flow.ref.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : notEmptyArray(step.targets, project.getFlowByFlowId(flow.ref.flowId).targets);

    for (const tIdOfTarget of sourceTargetIds) {
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

        if (!params) {
          params = this.getStreamConfig(targetStream, flow)?.jobParams ?? targetStream.config?.jenkinsJobParams;
        }

        if (this.config?.jobParams) {
          params = { ...this.config?.jobParams, ...params };
        }

        if (this.config?.jobParamsList?.length) {
          params = _.pick(params, this.config.jobParamsList);
        }

        if (params) {
          params = _.mapValues(params, (val) => rep(val));
        }

        await project.getEnvIntegraionByIntegrationId<JenkinsIntegrationService>(
          rep(step.config?.integration ?? 'jenkins'),
          'jenkins',
        ).withContext(context).runJob(
          this.getStreamConfig(targetStream, flow)?.jobName ?? targetStream.config?.jenkinsJobName ?? this.config?.jobName,
          params,
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

