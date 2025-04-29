import { IStreamService, IStreamServiceStreamMoveOpts, StreamServiceStreamMoveOptsStrategy } from '.';
import { IProjectTargetDef, IProjectTargetStream } from '../project';
import { IStreamStateContext, StreamState } from '../stream-state';
import { Service } from 'typedi';
import { TargetState } from '../target-state';
import { EntityService } from '../entities.service';
import { Autowired, hasScope, hasStrictScope } from '../utils';
import { GithubIntegrationService } from '../integrations/github';
import { Status } from '../enums/status';
import { AwaitedCache } from '../cache';
import { Log, logError } from '../logger';
import moment from 'moment-timezone';
import { ProjectsService } from '../projects.service';

const JOB_CONSLUSION_TO_STATUS_MAP = {
  failure: Status.FAILED,
  in_progress: Status.PROCESSING,
  skipped: Status.COMPLETED,
  success: Status.COMPLETED,
}
const JOB_STATUS_TO_STATUS_MAP = {
  completed: Status.SUCCESS,
  in_progress: Status.PROCESSING,
}

export type IGithubTargetStream = IProjectTargetStream<{
  integration?: string;
  org: string;
  repo?: string;
  branch: string;
}, 'github'>;

@Service()
export class GithubStreamService extends EntityService implements IStreamService {
  static readonly type: string = 'github';

  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;

  protected cache = new AwaitedCache<StreamState>();

  actionRun(id: string) { // eslint-disable-line

  }

  @Log('debug')
  async streamBookmark(stream: IGithubTargetStream): Promise<StreamState> {
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
      source.history.change[0].id,
      source.version,
      null,
      this.getRepoRef(stream),
      null,
      true,
    );

    return null;
  }

  @Log('debug')
  async streamDetach(stream: IGithubTargetStream): Promise<StreamState> {
    const integration = this.getIntegrationService(stream);
    const branchName = await this.getBranch(stream);

    await integration.branchDelete(
      branchName,
      this.getRepoRef(stream),
    );

    return null;
  }

  @Log('debug')
  async streamGetState(stream: IGithubTargetStream, scopes?: Record<string, boolean>, context?: IStreamStateContext): Promise<StreamState> {
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
      const repo = this.getRepoRef(stream);
      const branch = hasScope('change', scopes)
        ? await integration.branchGet(branchName, repo)
        : null;
      const versioningService = this.getVersioningService(stream);
      const workflowRuns = hasScope('action', scopes) && branch
        ? await integration.workflowRunList(branchName, repo, stream.config?.org)
        : null;
      const workflowRunsJobs = hasScope('action', scopes) &&
          workflowRuns?.[0] &&
          (
            hasStrictScope('*', scopes) ||
            hasStrictScope('action', scopes) ||
            workflowRuns?.[0]?.id !== parseInt(state.history?.action?.[0]?.id)
          )
        ? await integration.workflowJobList(workflowRuns[0].id, repo, stream.config?.org)
        : null;

      const metadata = {
        org: stream.config?.org ?? integration.config?.org,
        branch: branchName,
      };

      if (hasScope('action', scopes)) {
        state.history.action = workflowRuns?.length ? workflowRuns.map((w) => {
          const isJobStepsNotFailed = workflowRunsJobs?.[0]
            ? workflowRunsJobs[0].steps.every((jobStep) => jobStep.conclusion !== 'failure')
            : null;

          return {
            id: String(w.id),
            type: 'github:workflow',
    
            author: {
              name: w.actor?.name ?? w.actor?.login ?? null,
              link: w.actor?.html_url ?? null,
            },
            description: w.name,
            link: w.html_url ?? null,
            metadata: {},
            steps: workflowRunsJobs?.[0]
              ? workflowRunsJobs[0].steps.reduce((acc, jobStep, index) => {
                acc[jobStep.number] = {
                  id: String(jobStep.number),
                  type: 'github:workflow:job',

                  description: jobStep.name,
                  link: workflowRunsJobs[0].html_url ? `${workflowRunsJobs[0].html_url}#step:${index + 1}:1` : null,
                  runningTimeSeconds: jobStep.started_at
                    ? moment(jobStep.completed_at).diff(jobStep.started_at, 'seconds')
                    : null,
                  status: JOB_CONSLUSION_TO_STATUS_MAP[jobStep.conclusion ?? jobStep.status] ?? Status.UNKNOWN,
                };

                return acc;
              }, {})
              : state.history.action?.[0]?.steps ?? null,
            status: typeof isJobStepsNotFailed === 'boolean'
              ? isJobStepsNotFailed
                ? (JOB_STATUS_TO_STATUS_MAP[w.status] ?? w.status ?? null)
                : Status.FAILED
              : state.history.action?.[0]?.status ?? Status.COMPLETED,
            time: w.run_started_at ? new Date(w.run_started_at) : null,
          };
        }) : [];
      }

      if (hasScope('change', scopes)) {
        state.history.change = branch ? [ {
          id: branch.commit.sha,
          type: 'github:commit',

          author: {
            name: branch.commit.commit.author?.name ?? branch.commit.commit.author?.login ?? null,
            link: branch.commit.commit.author?.html_url ?? null,
          },
          description: branch.commit.commit.message,
          link: branch.commit.html_url,
          metadata: {},
          status: null,
          steps: null,
          time: branch.commit.commit.committer?.date ? new Date(branch.commit.commit.committer?.date) : null,
        } ] : [];
      }

      state.link = branch ? branch._links.html ?? null : state?.link ?? null;
      state.metadata = metadata;
      state.version = await versioningService.getCurrentStream(stream);

      if (hasScope('artifact', scopes) && stream.artifacts?.length) {
        if (context) {
          context.artifact = {
            githubWorkflowId: workflowRuns?.[0]?.id,
            githubWorkflowJobId: workflowRunsJobs?.[0]?.id,
            githubWorkflowRunJobStatus: state.history.action?.[0]?.status,
            ref: stream.ref,
            stream,
          };
        }
      }

      state.incVer();
    })().catch((err) => {
      logError(err, 'GithubStreamService.streamGetState');
    }).finally(() => {
      state.isSyncing = false;
    });

    this.cache.set(cacheKey, state);

    // if (stream.isDirty || hasStrictScope('resync', scopes)) {
    await detailsPromise;
    // }

    return state;
  }

  @Log('debug')
  async streamMove(sourceStream: IGithubTargetStream, targetStream: IGithubTargetStream, opts?: IStreamServiceStreamMoveOpts) {
    const project = this.projectsService.get(sourceStream.ref?.projectId);

    project.env.streams.assertTypes(sourceStream.type, targetStream.type);

    const sourceState = await this.projectsService
      .get(sourceStream.ref?.projectId)
      .getStreamStateByTargetAndStream(sourceStream.ref?.targetId, sourceStream.ref?.streamId, { change: true });

    if (!sourceState?.history?.change?.[0]?.id) {
      return;
    }

    const sourceBranchName = await this.getBranch(sourceStream);
    const targetBranchName = await this.getBranch(targetStream);

    const targetIntegration = project.getEnvIntegraionByTargetStream<GithubIntegrationService>(targetStream);

    if (!await targetIntegration.branchGet(
      targetBranchName,
      targetStream.id,
    )) {
      await targetIntegration.referenceCreate(
        targetBranchName,
        sourceState.history.change[0]?.id,
        targetStream.id,
      );
    } else {
      switch (opts?.strategy) {
      case StreamServiceStreamMoveOptsStrategy.REQUEST:
        await targetIntegration.pullRequestCreate(
          targetBranchName,
          sourceBranchName,
          `Release ${sourceState.version}`,
          undefined,
          undefined,
          targetStream.id,
        );
        break;
      case StreamServiceStreamMoveOptsStrategy.APPROVE:
        await targetIntegration.pullRequestMerge(
          (await targetIntegration.pullRequestList(sourceBranchName, targetBranchName, targetStream.id))?.[0]?.number ?? -99,
          targetStream.id,
        );
        break;
      default:
        await targetIntegration.merge(
          targetBranchName,
          sourceBranchName,
          `Release ${sourceState.version}`,
          targetStream.id,
        );
        break;
      }
    }
  }

  @Log('debug')
  async targetGetState(config: IProjectTargetDef): Promise<TargetState> {
    return new TargetState({
      id: config.id,
      type: null,
    });
  }

  private getIntegrationService(stream: IGithubTargetStream) {
    return this.projectsService
      .get(stream.ref.projectId)
      .getEnvIntegraionByTargetStream<GithubIntegrationService>(stream, this.type);
  }

  private getVersioningService(stream: IGithubTargetStream, target?: IProjectTargetDef) {
    const project = this.projectsService.get(stream.ref.projectId);

    if (!target) {
      target = project.getTargetByTargetStream(stream);
    }

    return project.getEnvVersioningByTarget(target);
  }

  private async getBranch(stream: IGithubTargetStream) {
    const project = this.projectsService.get(stream.ref.projectId);
    const integration = project.getEnvIntegraionByTargetStream<GithubIntegrationService>(stream, this.type);
    const target = project.getTargetByTargetStream(stream);
    const versioningService = this.getVersioningService(stream, target);
    const branch =
      await versioningService.getCurrentStream(stream, stream.config?.branch ?? integration.config?.branch) ||
      await versioningService.getCurrent(target, stream.config?.branch ?? integration.config?.branch);

    return branch ?? integration?.config?.branch;
  }

  private getRepoRef(stream: IGithubTargetStream): string {
    return stream.config?.repo ?? stream.id;
  }
}
