import { Octokit } from '@octokit/rest';
import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import fetch from 'node-fetch-native';
import { Log } from '../logger';
import { createError } from '../error';
import { maybeReplaceEnvVars } from './utils';

export interface IGithubConfig {
  branch?: string;
  org?: string;
  repository?: string;
  token?: string;
  useRepositoryAsOrg?: boolean;
}

@Service()
export class GithubIntegrationService extends EntityService implements IIntegrationService {
  protected client: Octokit;

  static readonly type: string = 'github';

  constructor(public readonly config?: IGithubConfig) {
    super();

    this.client = new Octokit({
      auth: maybeReplaceEnvVars(config?.token) ?? process.env.GITHUB_TOKEN,
      request: {
        fetch,
      },
    });
  }

  @IncStatistics() @Log('debug')
  async branchDelete(branch?, repo?, org?) {
    await this.client.git.deleteRef({
      owner: this.org(org), repo: this.repo(repo), ref: `heads/${this.branch(branch)}`,
    }).catch((err) => {
      if (err?.status === 404 || err?.status === 422) {
        return { data: undefined };
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async branchGet(branch?, repo?, org?) {
    return (await this.client.rest.repos.getBranch({
      owner: this.org(org), repo: this.repo(repo), branch: this.branch(branch),
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data;
  }

  @IncStatistics() @Log('debug')
  async merge(base, head, commitMessage?, repo?, org?) {
    return (await this.client.repos.merge({
      owner: this.org(org), repo: this.repo(repo), base, head: this.branch(head), commit_message: commitMessage,
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data;
  }

  @IncStatistics() @Log('debug')
  async orgVarCreate(key: string, val: any, org?) {
    this.config?.useRepositoryAsOrg
      ? await this.repositoryVarCreate(key, val, undefined, org)
      : await this.client.rest.actions.createOrgVariable({
        org: this.org(org), name: key, value: val, visibility: 'private',
      });
  }

  @IncStatistics() @Log('debug')
  async orgVarGet(key: string, org?) {
    const res = this.config?.useRepositoryAsOrg
      ? await this.repositoryVarGet(key, undefined, org)
      : (await this.client.rest.actions.getOrgVariable({
        org: this.org(org), name: key,
      }).catch((err) => {
        if (err?.status === 404) {
          return { data: null };
        }

        return Promise.reject(err);
      })).data?.value;

    return res ?? null;
  }

  @IncStatistics() @Log('debug')
  async orgVarUpdate(key: string, val: any, org?) {
    if (val === null) {
      if (!this.config?.useRepositoryAsOrg) {
        // await this.client.rest.actions.deleteOrgVariable({
        //   org: this.org(org), name: key,
        // });
      }

      return;
    }

    this.config?.useRepositoryAsOrg
      ? await this.repositoryVarUpdate(key, val, undefined, org)
      : await this.client.rest.actions.updateOrgVariable({
        org: this.org(org), name: key, value: val, visibility: 'private',
      });
  }

  @IncStatistics() @Log('debug')
  async orgMemberList(org?) {
    return (await this.client.orgs.listMembers({
      org: this.org(org), per_page: 100,
    })).data;
  }

  @IncStatistics() @Log('debug')
  async pullRequestCreate(base, head, title?, body?, draft?, repo?, org?) {
    return (await this.client.pulls.create({
      owner: this.org(org), repo: this.repo(repo), base, head: this.branch(head), title, body, draft,
    }).catch((err) => {
      if (err?.status === 422) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data;
  }

  @IncStatistics() @Log('debug')
  async pullRequestList(base, head, repo?, org?) {
    return (await this.client.pulls.list({
      owner: this.org(org), repo: this.repo(repo), base, head: this.branch(head), sort: 'created', state: 'open',
    }).catch((err) => {
      // if (err?.status === 422) {
      //   return { data: undefined };
      // }

      return Promise.reject(err);
    })).data;
  }

  @IncStatistics() @Log('debug')
  async pullRequestMerge(pullNumber, repo?, org?) {
    return pullNumber === -99 ? null : (await this.client.pulls.merge({
      owner: this.org(org), repo: this.repo(repo), pull_number: pullNumber,
    }).catch((err) => {
      if (err?.status === 404) {
        return Promise.reject(createError(err, 'stream:request:notFound'));
      }

      return Promise.reject(err);
    })).data;
  }

  @IncStatistics() @Log('debug')
  async referenceCreate(refName, sha, repo?, org?, refType?) {
    return (await this.client.git.createRef({
      owner: this.org(org), repo: this.repo(repo), ref: `refs/${ refType ?? 'heads' }/${refName}`, sha,
    }).catch((err) => {
      if (err?.status === 422) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data;
  }

  @IncStatistics() @Log('debug')
  async repositoryVarCreate(key: string, val: any, repo?, org?) {
    await this.client.rest.actions.createRepoVariable({
      owner: this.org(org), name: key, repo: this.repo(repo), value: val, visibility: 'private',
    });
  }

  @IncStatistics() @Log('debug')
  async repositoryVarGet(key: string, repo?, org?) {
    const res = (await this.client.rest.actions.getRepoVariable({
      owner: this.org(org), name: key, repo: this.repo(repo),
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: null };
      }

      return Promise.reject(err);
    })).data;

    return res ? res.value : null;
  }

  @IncStatistics() @Log('debug')
  async repositoryVarUpdate(key: string, val: any, repo?, org?) {
    if (val === null) {
      // await this.client.rest.actions.deleteRepoVariable({
      //   owner: this.org(org), name: key, repo: this.repo(repo),
      // });

      return;
    }

    await this.client.rest.actions.updateRepoVariable({
      owner: this.org(org), name: key, repo: this.repo(repo), value: val, visibility: 'private',
    });
  }

  @IncStatistics() @Log('debug')
  async tagCreate(sha, tag, commitMessage?, repo?, org?, lightweight?: boolean) {
    if (lightweight) {
      await this.referenceCreate(tag, sha, repo, org, 'tags');
    } else {
      const tagObj = (await this.client.git.createTag({
        message: commitMessage ?? tag,
        object: sha,
        owner: this.org(org),
        repo: this.repo(repo),
        tag,
        type: 'commit',
      })).data;
  
      await this.referenceCreate(tag, tagObj.sha, repo, org, 'tags');
    }
  }

  @IncStatistics() @Log('debug')
  async userGet(username) {
    return (await this.client.users.getByUsername({
      username,
    })).data;
  }

  @IncStatistics() @Log('debug')
  async workflowRunList(branch?, repo?, org?) {
    return (await this.client.actions.listWorkflowRunsForRepo({
      owner: this.org(org), repo: this.repo(repo), branch: this.branch(branch), per_page: 1,
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data?.workflow_runs;
  }

  @IncStatistics() @Log('debug')
  async workflowArtifactList(runId, repo?, org?) {
    return (await this.client.actions.listWorkflowRunArtifacts({
      owner: this.org(org), repo: this.repo(repo), run_id: runId,
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data?.artifacts;
  }

  @IncStatistics() @Log('debug')
  async workflowArtifactGet(artifactId, repo?, org?) {
    return (await this.client.actions.downloadArtifact({
      owner: this.org(org), repo: this.repo(repo), artifact_id: artifactId, archive_format: 'zip',
    })).data;
  }

  @IncStatistics() @Log('debug')
  async workflowJobList(runId, repo?, org?) {
    return (await this.client.actions.listJobsForWorkflowRun({
      owner: this.org(org), repo: this.repo(repo), run_id: runId, filter: 'latest',
    }).catch((err) => {
      if (err?.status === 404) {
        return { data: undefined };
      }

      return Promise.reject(err);
    })).data?.jobs;
  }

  @IncStatistics() @Log('debug')
  async workflowJobGet(jobId, repo?, org?) {
    return (await this.client.actions.getJobForWorkflowRun({
      owner: this.org(org), repo: this.repo(repo), job_id: jobId,
    })).data;
  }

  @IncStatistics() @Log('debug')
  async workflowJobLogGet(jobId, repo?, org?) {
    return (await this.client.actions.downloadJobLogsForWorkflowRun({
      owner: this.org(org), repo: this.repo(repo), job_id: jobId,
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
