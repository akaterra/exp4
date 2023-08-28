import { Octokit } from '@octokit/rest';
import { IIntegrationService } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import fetch from 'node-fetch-native';

export interface IGithubConfig {
  branch?: string;
  org?: string;
  repository?: string;
  token?: string;
}

@Service()
export class GithubIntegrationService extends EntityService implements IIntegrationService {
  protected client: Octokit;

  static readonly type: string = 'github';

  constructor(public readonly config?: IGithubConfig) {
    super();

    this.client = new Octokit({
      auth: config?.token ?? process.env.GITHUB_TOKEN,
      request: {
        fetch,
      },
    });
  }

  async branchDelete(branch?, repo?, org?) {
    const res = (await this.client.git.deleteRef({
      owner: this.org(org), repo: this.repo(repo), ref: `heads/${this.branch(branch)}`,
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data;
  }

  async orgVarCreate(key: string, val: any, org?) {
    const res = (await this.client.rest.actions.createOrgVariable({
      org: this.org(org),
      name: key,
      value: val,
      visibility: 'private',
    })).data;
  }

  async orgVarGet(key: string, org?) {
    const res = (await this.client.rest.actions.getOrgVariable({
      org: this.org(org),
      name: key,
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: null };
      }

      return Promise.reject(err);
    })).data;

    return res ? res.value : null;
  }

  async orgVarUpdate(key: string, val: any, org?) {
    const res = (await this.client.rest.actions.updateOrgVariable({
      org: this.org(org),
      name: key,
      value: val,
      visibility: 'private',
    })).data;
  }

  async gitCreateReference(refName, sha, repo?, org?) {
    return (await this.client.git.createRef({
      owner: this.org(org), repo: this.repo(repo), ref: `refs/heads/${refName}`, sha,
    })).data;
  }

  async gitGetBranch(branch?, repo?, org?) {
    return (await this.client.rest.repos.getBranch({
      owner: this.org(org), repo: this.repo(repo), branch: this.branch(branch),
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data;
  }

  async gitGetWorkflowRuns(branch?, repo?, org?) {
    return (await this.client.actions.listWorkflowRunsForRepo({
      owner: this.org(org), repo: this.repo(repo), branch: this.branch(branch), per_page: 1,
    })).data?.workflow_runs;
  }

  async gitGetWorkflowJobs(runId, repo?, org?) {
    return (await this.client.actions.listJobsForWorkflowRun({
      owner: this.org(org), repo: this.repo(repo), run_id: runId,
    })).data;
  }

  async gitGetWorkflowJob(jobId, repo?, org?) {
    return (await this.client.actions.getJobForWorkflowRun({
      owner: this.org(org), repo: this.repo(repo), job_id: jobId,
    })).data;
  }

  async gitMerge(base, head, commitMessage?, repo?, org?) {
    return (await this.client.repos.merge({
      owner: this.org(org), repo: this.repo(repo), base, head: this.branch(head), commit_message: commitMessage,
    })).data;
  }

  private branch(branch?) {
    return branch ?? this.config?.branch;
  }

  private org(org?) {
    return org ?? this.config?.org;
  }

  private repo(repo?) {
    return repo ?? this.config?.repository;
  }
}
