import { Octokit } from '@octokit/rest';
import { IStreamService } from './stream.service';
import { IProjectTarget, IProjectTargetDef, IProjectTargetStream } from '../project';
import { IStream } from '../stream';
import { Service } from 'typedi';
import { ITarget } from '../target';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { IntegrationsService } from '../integrations.service';
import { GithubIntegrationService } from '../integrations/github';
import { VersioningsService } from '../versionings.service';
import { ProjectsService } from '../projects.service';

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

  @Autowired() protected projectsService: ProjectsService;
  protected client = new Octokit({
    auth: process.env.GITHUB_TOKEN,
  });

  actionRun(id: string) {

  }

  async streamGetState(stream: IGithubTargetStream): Promise<IStream> {
    const integration = this.getIntegration(stream);
    const branchName = await this.getBranch(stream);
    const branch = await integration.gitGetBranch(branchName, stream.id);
    const workflowRuns = branch
      ? await integration.gitGetWorkflowRuns(stream.config.branch, stream.id)
      : [];
    // const workflowRunsJobs = workflowRuns?.[0]
    //   ? await integration.getWorkflowJobs(stream.config.org, stream.id, workflowRuns[0].id)
    //   : [];

    const metadata = {
      org: stream.config?.org ?? integration.config?.org,
      branch: branchName,
    };

    return {
      id: stream.id,
      type: this.type,

      projectId: stream.ref.projectId,
      targetId: stream.ref.targetId,

      history: {
        action: workflowRuns ? workflowRuns.map((w) => ({
          id: String(w.id),
          type: 'github:workflow',
  
          author: { name: w.actor?.name ?? null, link: w.actor?.html_url ?? null },
          description: w.name,
          link: w.html_url ?? null,
          metadata: {},
          status: w.status ?? null,
          time: null,
        })) : [],
        change: branch ? [ {
          id: branch.commit.sha,
          type: 'github:commit',
  
          author: { name: branch.commit.commit.committer?.name ?? null, link: branch.commit.commit.committer?.html_url ?? null },
          description: branch.commit.commit.message,
          link: branch.commit.html_url,
          metadata: {},
          status: null,
          time: branch.commit.commit.committer?.date ?? null,
        } ] : [],
      },
      link: branch ? branch._links.html : null,
      metadata,
      version: null,
    };
  }

  streamGetBuildState(stream: IGithubTargetStream): Promise<IStream> {
    return null;
  }

  async streamMove(sourceStream: IGithubTargetStream, targetStream: IGithubTargetStream) {
    const source = await this.streamGetState(sourceStream);
    const sourceIntegration = this.projectsService.get(sourceStream.ref.projectId).getIntegraionByTargetStream<GithubIntegrationService>(sourceStream);
    const sourceBranchName = await this.getBranch(sourceStream);
    const targetIntegration = this.projectsService.get(targetStream.ref.projectId).getIntegraionByTargetStream<GithubIntegrationService>(targetStream);
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

  private getIntegration(stream: IGithubTargetStream) {
    return this.projectsService.get(stream.ref.projectId).getIntegraionByTargetStream<GithubIntegrationService>(stream);
  }

  private async getBranch(stream: IGithubTargetStream) {
    const project = this.projectsService.get(stream.ref.projectId);
    const integration = project.getIntegraionByTargetStream<GithubIntegrationService>(stream);
    const target = project.getTargetByTargetStream(stream);
    const branch = await project.getVersioningByTarget(target)
      .format(target, stream.config?.branch ?? integration.config?.branch);

    return branch;
  }
}
