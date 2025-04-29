import { IStreamService } from '.';
import { IProjectTargetDef, IProjectTargetStream } from '../project';
import { StreamState } from '../stream-state';
import { Service } from 'typedi';
import { TargetState } from '../target-state';
import { EntityService } from '../entities.service';
import { Autowired, hasScope, hasStrictScope } from '../utils';
import { GitlabIntegrationService } from '../integrations/gitlab';
import { AwaitedCache } from '../cache';
import { Log, logError } from '../logger';
import { BitbucketIntegrationService } from '../integrations/bitbucket';
import { ProjectsService } from '../projects.service';

// const JOB_CONSLUSION_TO_STATUS_MAP = {
//   failure: Status.FAILED,
//   skipped: Status.COMPLETED,
//   success: Status.COMPLETED,
// }
// const JOB_STATUS_TO_STATUS_MAP = {
//   is_progress: Status.PROCESSING,
// }

export type IBitbucketTargetStream = IProjectTargetStream<{
  integration?: string;
  workspace: string;
  repo: string;
  branch: string;
}, 'bitbucket'>;

export type IBitbucketStream = StreamState<{
  sha: string;
  branch: string;
}>;

@Service()
export class BitbucketStreamService extends EntityService implements IStreamService {
  static readonly type: string = 'bitbucket';

  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;

  protected cache = new AwaitedCache<StreamState>();

  actionRun(id: string) { // eslint-disable-line

  }

  @Log('debug')
  async streamBookmark(stream: IBitbucketTargetStream): Promise<StreamState> {
    const project = this.projectsService.get(stream.ref?.projectId);

    project.env.streams.assertTypes(stream.type, this.type);

    const source = await this.projectsService
      .get(stream.ref?.projectId)
      .getStreamStateByTargetAndStream(stream.ref?.targetId, stream.ref?.streamId, { change: true });

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
  async streamDetach(stream: IBitbucketTargetStream): Promise<StreamState> {
    const integration = this.getIntegrationService(stream);
    const branchName = await this.getBranch(stream);

    await integration.branchDelete(
      branchName,
      stream.id,
    );

    return null;
  }

  @Log('debug')
  async streamGetState(stream: IBitbucketTargetStream, scopes?: Record<string, boolean>): Promise<StreamState> {
    const cacheKey = `${stream.ref?.projectId}:${stream.ref?.targetId}:${stream.ref?.streamId}`;
    const state: StreamState = await this.cache.get(cacheKey) ?? new StreamState({
      id: stream.id,
      type: this.type,

      history: {
        action: [],
        artifact: [],
        change: [],
      },
      isSyncing: true,
      link: null,
      metadata: {},
      version: null,
    });

    const detailsPromise = (async () => {
      state.isSyncing = true;

      const integration = this.getIntegrationService(stream);
      const branchName = await this.getBranch(stream);
      const branch = hasScope('change', scopes) ? await integration.branchGet(branchName, stream.id) : null;
      const versioningService = await this.projectsService
        .get(stream.ref.projectId)
        .getEnvVersioningByTargetStream(stream);
      // const workflowRuns = hasScope('action', scopes) && branch
      //   ? await integration.workflowRunsGet(stream.config.branch, stream.id)
      //   : null;
      // const workflowRunsJobs = hasScope('action', scopes) && workflowRuns?.[0] && workflowRuns?.[0]?.id !== parseInt(state.history?.action?.[0]?.id)
      //   ? await integration.workflowRunJobsGet(workflowRuns[0].id, stream.id, stream.config.org)
      //   : null;

      const metadata = {
        workspace: stream.config?.workspace ?? integration.config?.workspace,
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
          id: branch.target.hash,
          type: `${this.type}:commit`,

          author: {
            name: branch.target.author?.user?.display_name ?? null,
            link: (branch.target.author?.user?.links as any)?.html?.href ?? null,
          },
          description: branch.target.message ?? null,
          link: (branch.target.links as any)?.html?.href ?? null,
          metadata: {},
          status: null,
          steps: null,
          time: branch.target.date ? new Date(branch.target.date) : null,
        } ] : [];
      }

      state.link = branch ? branch.links?.html?.href ?? null : state?.link ?? null;
      state.metadata = metadata;
      state.version = await versioningService.getCurrentStream(stream);
  
      if (hasScope('artifact', scopes) && stream.artifacts?.length) {
        await this.getArtifactsService(stream).run(
          { artifacts: stream.artifacts, ref: stream.ref },
          state,
          {
            // githubWorkflowJobId: workflowRunsJobs?.[0]?.id,
            githubWorkflowRunJobStatus: state.history.action?.[0]?.status,
            ref: stream.ref,
          },
        );
      }

      state.incVer();
    })().catch((err) => {
      logError(err, 'GitlabStreamService.streamGetState');
    }).finally(() => {
      state.isSyncing = false;
    });

    this.cache.set(cacheKey, state);

    if (stream.isDirty || hasStrictScope('resync', scopes)) {
      await detailsPromise;
    }

    return state;
  }

  @Log('debug')
  async streamMove(sourceStream: IBitbucketTargetStream, targetStream: IBitbucketTargetStream) {
    const project = this.projectsService.get(sourceStream.ref?.projectId);

    project.env.streams.assertTypes(sourceStream.type, targetStream.type);

    const source = await this.projectsService
      .get(sourceStream.ref?.projectId)
      .getStreamStateByTargetAndStream(sourceStream.ref?.targetId, sourceStream.ref?.streamId, { change: true });

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
  async targetGetState(config: IProjectTargetDef): Promise<TargetState> {
    return new TargetState({
      id: config.id,
      type: null,
    });
  }

  private getArtifactsService(stream: IBitbucketTargetStream) {
    return this.projectsService.get(stream.ref.projectId).env.artifacts;
  }

  private getIntegrationService(stream: IBitbucketTargetStream) {
    return this.projectsService
      .get(stream.ref.projectId)
      .getEnvIntegraionByTargetStream<BitbucketIntegrationService>(stream, this.type);
  }

  private async getBranch(stream: IBitbucketTargetStream) {
    const project = this.projectsService.get(stream.ref.projectId);
    const integration = project.getEnvIntegraionByTargetStream<BitbucketIntegrationService>(stream);
    const target = project.getTargetByTargetStream(stream);
    const branch = await project.getEnvVersioningByTarget(target)
      .getCurrent(target, stream.config?.branch ?? integration.config?.branch);

    return branch ?? integration?.config?.branch;
  }
}
