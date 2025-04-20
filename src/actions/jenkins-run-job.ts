import { Service } from 'typedi';
import { IProjectAction, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IActionService } from './_action.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired, resolvePlaceholders } from '../utils';
import { getPossibleTargetIds, markDirty, notEmptyArray } from './utils';
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
export class JenkinsJobRunActionService extends EntityService implements IActionService {
  static readonly type = 'jenkins:jobRun';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: IJenkinsJobRunStepConfig) {
    super();
  }

  @Log('debug')
  async run(
    flow: IProjectFlowDef,
    action: IProjectAction<IJenkinsJobRunStepConfig>,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);
    const projectState = await this.projectsService.getState(flow.ref.projectId);
    const sourceTargetIds: IProjectTargetDef['id'][] = notEmptyArray(
      action.targets,
      getPossibleTargetIds(targetsStreams, project.getFlowByFlowId(flow.ref.flowId).targets),
    );

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

        params = {
          ...this.config?.jobParams,
          ...action.config?.jobParams,
          ...targetStream.config?.jenkins?.jobParams,
          ...this.getStreamConfig(targetStream, flow)?.jobParams,
          ...params,
        }

        if (this.config?.jobParamsList?.length) {
          params = _.pick(params, this.config.jobParamsList);
        }

        if (params) {
          params = _.mapValues(params, (val) => rep(val));
        }

        await project.getEnvIntegraionByIntegrationId<JenkinsIntegrationService>(
          rep(action.config?.integration ?? 'jenkins'),
          'jenkins',
        ).withContext(context).runJob(
          this.getStreamConfig(targetStream, flow)?.jobName ??
            targetStream.config?.jenkins?.jobName ??
            action.config?.jobName ??
            this.config?.jobName,
          params,
        );

        markDirty(targetStream);
      }

      markDirty(target);
    }
  }

  private getStreamConfig(stream, flow) {
    return stream.config?.jenkins?.flows?.[flow.id] ?? stream.config?.jenkins as any;
  }
}
