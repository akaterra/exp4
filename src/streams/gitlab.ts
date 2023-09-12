import { Octokit } from '@octokit/rest';
import { IStreamService } from './stream.service';
import { IProjectTarget, IProjectTargetStream } from '../project';
import { IStream } from '../stream';
import { Service } from 'typedi';
import { ITarget } from '../target';
import { EntityService } from '../entities.service';
import { hasScope } from '../utils';
import { GitlabIntegrationService } from '../integrations/gitlab';
import { Status } from '../enums/status';
import { AwaitedCache } from '../cache';
import { Log, logError } from '../logger';

const JOB_CONSLUSION_TO_STATUS_MAP = {
  failure: Status.FAILED,
  skipped: Status.COMPLETED,
  success: Status.COMPLETED,
}
const JOB_STATUS_TO_STATUS_MAP = {
  is_progress: Status.PROCESSING,
}

export type IGitlabTargetStream = IProjectTargetStream<{
  integration?: string;
  org: string;
  repo: string;
  branch: string;
}, 'gitlab'>;

export type IGitlabStream = IStream<{
  sha: string;
  branch: string;
}>;

@Service()
export class GitlabStreamService extends EntityService implements IStreamService {
  static readonly type: string = 'gitlab';

  protected cache = new AwaitedCache<IStream>();

  actionRun(id: string) { // eslint-disable-line

  }

  @Log('debug')
  async streamBookmark(stream: IGitlabTargetStream): Promise<IStream> {
    const project = this.projectsService.get(stream.ref?.projectId);

    project.env.streams.assertTypes(stream.type, this.type);

    const source = await this.projectsService
      .get(stream.ref?.projectId)
      .getStreamStateByTargetIdAndStreamId(stream.ref?.targetId, stream.ref?.streamId, { change: true });

    if (!source?.history?.change?.[0]?.id) {
      return;
    }

    const integration = this.getIntegrationService(stream);

    await integration.tagCreate(
      source?.history?.change?.[0]?.id,
      source.version,
      null,
      stream?.config?.repo ?? stream?.id,
      null,
    );

    return null;
  }

  @Log('debug')
  async streamDetach(stream: IGitlabTargetStream): Promise<IStream> {
    const integration = this.getIntegrationService(stream);
    const branchName = await this.getBranch(stream);

    await integration.branchDelete(
      branchName,
      stream.id,
    );

    return null;
  }

  @Log('debug')
  async streamGetState(stream: IGitlabTargetStream, scopes?: Record<string, boolean>): Promise<IStream> {
    const cacheKey = `${stream.ref?.projectId}:${stream.ref?.targetId}:${stream.ref?.streamId}`;
    const state: IStream = await this.cache.get(cacheKey) ?? {
      id: stream.id,
      type: this.type,

      projectId: stream.ref.projectId,
      targetId: stream.ref.targetId,

      history: {
        action: [],
        artifact: [],
        change: [],
      },
      isSyncing: true,
      link: null,
      metadata: {},
      version: null,
    };

    const detailsPromise = (async () => {
      state.isSyncing = true;

      const integration = this.getIntegrationService(stream);
      const branchName = await this.getBranch(stream);
      const branch = hasScope('change', scopes) ? await integration.branchGet(branchName, stream.id) : null;
      const versioningService = await this.projectsService
        .get(stream.ref.projectId)
        .getEnvVersioningByTargetId(stream.ref.targetId);
      // const workflowRuns = hasScope('action', scopes) && branch
      //   ? await integration.workflowRunsGet(stream.config.branch, stream.id)
      //   : null;
      // const workflowRunsJobs = hasScope('action', scopes) && workflowRuns?.[0] && workflowRuns?.[0]?.id !== parseInt(state.history?.action?.[0]?.id)
      //   ? await integration.workflowRunJobsGet(workflowRuns[0].id, stream.id, stream.config.org)
      //   : null;

      const metadata = {
        org: stream.config?.org ?? integration.config?.org,
        branch: branchName,
      };

      // if (hasScope('action', scopes)) {
      //   state.history.action = workflowRuns?.length ? workflowRuns.map((w) => {
      //     const isJobStepsNotFailed = workflowRunsJobs?.[0]
      //       ? workflowRunsJobs[0].steps.every((jobStep) => jobStep.conclusion !== 'failure')
      //       : null;

      //     return {
      //       id: String(w.id),
      //       type: 'github:workflow',
    
      //       author: {
      //         name: w.actor?.name ?? w.actor?.login ?? null,
      //         link: w.actor?.html_url ?? null,
      //       },
      //       description: w.name,
      //       link: w.html_url ?? null,
      //       metadata: {},
      //       steps: workflowRunsJobs?.[0]
      //         ? workflowRunsJobs[0].steps.reduce((acc, jobStep) => {
      //           acc[jobStep.number] = {
      //             id: String(jobStep.number),
      //             type: 'github:workflow:job',

      //             description: jobStep.name,
      //             link: workflowRunsJobs[0].html_url,
      //             status: JOB_CONSLUSION_TO_STATUS_MAP[jobStep.conclusion] ?? Status.UNKNOWN,
      //           };

      //           return acc;
      //         }, {})
      //         : state.history.action?.[0]?.steps ?? null,
      //       status: typeof isJobStepsNotFailed === 'boolean'
      //         ? isJobStepsNotFailed
      //           ? (JOB_STATUS_TO_STATUS_MAP[w.status] ?? w.status ?? null)
      //           : Status.FAILED
      //         : state.history.action?.[0]?.status ?? Status.COMPLETED,
      //       time: w.run_started_at,
      //     };
      //   }) : [];
      // }

      if (hasScope('change', scopes)) {
        state.history.change = branch ? [ {
          id: branch.commit.id,
          type: 'gitlab:commit',

          author: {
            name: branch.commit.committer_name ?? null,
            link: null,
          },
          description: branch.commit.message ?? null,
          link: branch.commit.web_url as string ?? null,
          metadata: {},
          status: null,
          steps: null,
          time: branch.commit.created_at ? new Date(branch.commit.created_at as string) : null,
        } ] : [];
      }

      state.link = branch ? branch.web_url ?? null : state?.link ?? null;
      state.metadata = metadata;
      state.version = await versioningService.getCurrentStream(stream);
  
      if (hasScope('artifact', scopes) && stream.artifacts?.length) {
        await this.getArtifactsService(stream).run(
          { artifacts: stream.artifacts, ref: stream.ref },
          state,
          {
            // githubWorkflowRunJobId: workflowRunsJobs?.[0]?.id,
            githubWorkflowRunJobStatus: state.history.action?.[0]?.status,
            ref: stream.ref,
          },
        );
      }

      // stream.isDirty = false;
    })().catch((err) => {
      logError(err, 'GitlabStreamService.streamGetState');
    }).finally(() => {
      state.isSyncing = false;
    });

    this.cache.set(cacheKey, state);

    if (stream.isDirty) {
      await detailsPromise;
    }

    return state;
  }

  @Log('debug')
  async streamMove(sourceStream: IGitlabTargetStream, targetStream: IGitlabTargetStream) {
    const project = this.projectsService.get(sourceStream.ref?.projectId);

    project.env.streams.assertTypes(sourceStream.type, targetStream.type);

    const source = await this.projectsService
      .get(sourceStream.ref?.projectId)
      .getStreamStateByTargetIdAndStreamId(sourceStream.ref?.targetId, sourceStream.ref?.streamId, { change: true });

    if (!source?.history?.change?.[0]?.id) {
      return;
    }

    const sourceBranchName = await this.getBranch(sourceStream);
    const targetBranchName = await this.getBranch(targetStream);

    const targetIntegration = project.getEnvIntegraionByTargetStream<GitlabIntegrationService>(targetStream);

    if (!await targetIntegration.branchGet(
      targetBranchName,
      targetStream.id,
    )) {
      await targetIntegration.branchCreate(
        targetBranchName,
        source.history.change[0]?.id,
        targetStream.id,
      );
    } else {
      await targetIntegration.merge(
        sourceBranchName,
        targetBranchName,
        `Release ${source.version}`,
        targetStream.id,
      );
    }
  }

  @Log('debug')
  async targetGetState(config: IProjectTarget): Promise<ITarget> {
    return {
      id: config.id,
      type: null,
    };
  }

  private getArtifactsService(stream: IGitlabTargetStream) {
    return this.projectsService.get(stream.ref.projectId).env.artifacts;
  }

  private getIntegrationService(stream: IGitlabTargetStream) {
    return this.projectsService
      .get(stream.ref.projectId)
      .getEnvIntegraionByTargetStream<GitlabIntegrationService>(stream, this.type);
  }

  private async getBranch(stream: IGitlabTargetStream) {
    const project = this.projectsService.get(stream.ref.projectId);
    const integration = project.getEnvIntegraionByTargetStream<GitlabIntegrationService>(stream);
    const target = project.getTargetByTargetStream(stream);
    const branch = await project.getEnvVersioningByTarget(target)
      .getCurrent(target, stream.config?.branch ?? integration.config?.branch);

    return branch ?? integration?.config?.branch;
  }
}
