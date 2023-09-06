import { Octokit } from '@octokit/rest';
import { IStreamService } from './stream.service';
import { IProjectTarget, IProjectTargetStream } from '../project';
import { IStream } from '../stream';
import Container, { Service } from 'typedi';
import { ITarget } from '../target';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { GithubIntegrationService } from '../integrations/github';
import { ProjectsService } from '../projects.service';
import { Status } from '../enums/status';
import { AwaitedCache } from '../cache';
import { StubArtifactService } from '../artifacts/stub.service';

const JOB_CONSLUSION_TO_STATUS_MAP = {
  failure: Status.FAILED,
  skipped: Status.COMPLETED,
  success: Status.COMPLETED,
}
const JOB_STATUS_TO_STATUS_MAP = {
  is_progress: Status.PROCESSING,
}

export type IGithubTargetStream = IProjectTargetStream<{
  integration?: string;
  org: string;
  branch: string;
}, 'github'>;

export type IGithubStream = IStream<{
  sha: string;
  branch: string;
}>;

@Service()
export class GithubStreamService extends EntityService implements IStreamService {
  static readonly type: string = 'github';

  protected cache = new AwaitedCache<IStream>();
  @Autowired() protected projectsService: ProjectsService;
  protected client = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  actionRun(id: string) { // eslint-disable-line

  }

  async streamDetach(stream: IGithubTargetStream): Promise<IStream> {
    const integration = this.getIntegrationService(stream);
    const branchName = await this.getBranch(stream);

    await integration.branchDelete(
      branchName,
      stream.id,
    );

    return null;
  }

  async streamGetState(stream: IGithubTargetStream, old?: IStream): Promise<IStream> {
    const cacheKey = `${stream.ref?.projectId}:${stream.ref?.targetId}:${stream.ref?.streamId}`;

    if (!old) {
      old = await this.cache.get(cacheKey);
    }

    const integration = this.getIntegrationService(stream);
    const branchName = await this.getBranch(stream);
    const branch = await integration.gitGetBranch(branchName, stream.id);
    const versioningService = await this.projectsService.get(stream.ref.projectId).getEnvVersioningByTargetId(stream.ref.targetId);
    const workflowRuns = branch
      ? await integration.gitGetWorkflowRuns(stream.config.branch, stream.id)
      : [];
    const workflowRunsJobs = workflowRuns?.[0]
      ? await integration.gitGetWorkflowJobs(workflowRuns[0].id, stream.id, stream.config.org)
      : [];

    const metadata = {
      org: stream.config?.org ?? integration.config?.org,
      branch: branchName,
    };

    const state = {
      id: stream.id,
      type: this.type,

      projectId: stream.ref.projectId,
      targetId: stream.ref.targetId,

      history: {
        action: workflowRuns ? workflowRuns.map((w) => {
          const isJobStepsNotFailed = workflowRunsJobs[0]
            ? workflowRunsJobs[0].steps.every((jobStep) => jobStep.conclusion !== 'failure')
            : true;

          return {
            id: String(w.id),
            type: 'github:workflow',
    
            author: { name: w.actor?.name ?? w.actor?.login ?? null, link: w.actor?.html_url ?? null },
            description: w.name,
            link: w.html_url ?? null,
            metadata: {},
            steps: workflowRunsJobs?.[0]
              ? workflowRunsJobs[0].steps.reduce((acc, jobStep) => {
                acc[jobStep.number] = {
                  id: String(jobStep.number),
                  type: 'github:workflow:job',

                  description: jobStep.name,
                  link: workflowRunsJobs[0].html_url,
                  status: JOB_CONSLUSION_TO_STATUS_MAP[jobStep.conclusion] ?? Status.UNKNOWN,
                };

                return acc;
              }, {})
              : null,
            status: isJobStepsNotFailed ? (JOB_STATUS_TO_STATUS_MAP[w.status] ?? w.status ?? null) : Status.FAILED,
            time: null,
          };
        }) : [],
        artifact: [],
        change: branch ? [ {
          id: branch.commit.sha,
          type: 'github:commit',
  
          author: { name: branch.commit.commit.author?.name ?? branch.commit.commit.author?.login ?? null, link: branch.commit.commit.author?.html_url ?? null },
          description: branch.commit.commit.message,
          link: branch.commit.html_url,
          metadata: {},
          status: null,
          steps: null,
          time: branch.commit.commit.committer?.date ?? null,
        } ] : [],
      },
      link: branch ? branch._links.html : null,
      metadata,
      version: await versioningService.getCurrentStream(stream),
    };

    if (stream.artifacts?.length) {
      await this.getArtifactsService(stream).run(
        { artifacts: stream.artifacts, ref: stream.ref },
        state,
        {
          githubWorkflowRunJobId: workflowRunsJobs?.[0]?.id,
          githubWorkflowRunJobStatus: state.history.action?.[0]?.status,
          ref: stream.ref,
        },
      );
    } else if (old) {
      state.history.artifact = old.history.artifact;
    }

    this.cache.set(cacheKey, state);

    return state;
  }

  async streamMove(sourceStream: IGithubTargetStream, targetStream: IGithubTargetStream) {
    const source = await this.streamGetState(sourceStream);
    const sourceBranchName = await this.getBranch(sourceStream);
    const targetIntegration = this.projectsService.get(targetStream.ref.projectId).getEnvIntegraionByTargetStream<GithubIntegrationService>(targetStream);
    const targetBranchName = await this.getBranch(targetStream);

    if (!await targetIntegration.gitGetBranch(
      targetBranchName,
      targetStream.id,
    )) {
      await targetIntegration.gitCreateReference(
        targetBranchName,
        source.history.change[0]?.id,
        targetStream.id,
      );
    }

    await targetIntegration.gitMerge(
      sourceBranchName,
      targetBranchName,
      `Release ${source.version}`,
      targetStream.id,
    )
  }

  async targetGetState(config: IProjectTarget): Promise<ITarget> {
    return {
      id: config.id,
      type: null,
    };
  }

  private getArtifactsService(stream: IGithubTargetStream) {
    return this.projectsService.get(stream.ref.projectId).env.artifacts;
  }

  private getIntegrationService(stream: IGithubTargetStream) {
    return this.projectsService.get(stream.ref.projectId).getEnvIntegraionByTargetStream<GithubIntegrationService>(stream);
  }

  private async getBranch(stream: IGithubTargetStream) {
    const project = this.projectsService.get(stream.ref.projectId);
    const integration = project.getEnvIntegraionByTargetStream<GithubIntegrationService>(stream);
    const target = project.getTargetByTargetStream(stream);
    const branch = await project.getEnvVersioningByTarget(target)
      .getCurrent(target, stream.config?.branch ?? integration.config?.branch);

    return branch;
  }
}
