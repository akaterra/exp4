import * as Resources from '@gitbeaker/core';
import { Gitlab } from '@gitbeaker/rest';
import { IIntegrationService, IncStatistics } from '.';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Log, logErrorWarn } from '../logger';
import { maybeReplaceEnvVars } from './utils';

export interface IGitlabConfig {
  branch?: string;
  host?: string;
  org?: string;
  repository?: string;
  token?: string;
  useRepositoryAsOrg?: boolean;
}

@Service()
export class GitlabIntegrationService extends EntityService<IGitlabConfig> implements IIntegrationService {
  protected client: Resources.Gitlab;

  protected _validationSchema = {
    branch: { type: 'string', required: false, constraints: { minLength: 1 } },
    host: { type: 'string', required: false, constraints: { minLength: 1 } },
    org: { type: 'string', required: false, constraints: { minLength: 1 } },
    repository: { type: 'string', required: false, constraints: { minLength: 1 } },
    token: { type: 'string', required: false, constraints: { minLength: 1 } },
    useRepositoryAsOrg: { type: 'boolean', required: false },
  };

  static readonly type: string = 'gitlab';

  // constructor(public readonly config?: IGitlabConfig) {
  //   super();

  //   this.client = new Gitlab({
  //     host: maybeReplaceEnvVars(this.config?.host) ?? process.env.GITLAB_HOST,
  //     token: maybeReplaceEnvVars(this.config?.token) ?? process.env.GITLAB_TOKEN,
  //   });
  // }

  onConfigBefore(config: IGitlabConfig): IGitlabConfig {
    return {
      ...config,
      org: maybeReplaceEnvVars(config.org) || process.env.GITLAB_ORG,
      repository: maybeReplaceEnvVars(config.repository) || process.env.GITLAB_REPOSITORY,
    };
  }

  onConfigAfter(config: IGitlabConfig): IGitlabConfig {
    this.client = new Gitlab({
      host: maybeReplaceEnvVars(config.host) ?? process.env.GITLAB_HOST,
      token: maybeReplaceEnvVars(config.token) ?? process.env.GITLAB_TOKEN,
    });

    return config;
  }

  @IncStatistics() @Log('debug')
  async branchCreate(branch, sha, repo?, org?) {
    return this.client.Branches.create(this.repo(repo), this.branch(branch), sha);
  }

  @IncStatistics() @Log('debug')
  async branchDelete(branch, repo?, org?) {
    await this.client.Branches.remove(this.repo(repo), this.branch(branch)).catch((err) => {
      logErrorWarn(err, 'GitlabIntegrationService.branchDelete', { branch: this.branch(branch), repo: this.repo(repo) });

      if (err?.message === 'Not Found') {
        return null;
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async branchGet(branch?, repo?, org?) {
    return (await this.client.Branches.all(
      this.repo(repo),
      { search: `^${this.branch(branch)}$` },
    ).catch((err) => {
      logErrorWarn(err, 'GitlabIntegrationService.branchGet', { branch: this.branch(branch), repo: this.repo(repo) });

      if (err?.message === 'Not Found') {
        return null;
      }

      return Promise.reject(err);
    }))?.[0];
  }

  @IncStatistics() @Log('debug')
  async orgMembersList(org?) {
    return this.client.Users.all({ active: true });
  }

  @IncStatistics() @Log('debug')
  async merge(sourceBranch, targetBranch, commitMessage?, repo?, org?) {
    const mergeRequestRes = await this.client.MergeRequests.create(
      this.repo(repo),
      sourceBranch,
      targetBranch,
      commitMessage,
    ).catch((err) => {
      logErrorWarn(err, 'GitlabIntegrationService.merge', { sourceBranch, targetBranch, repo: this.repo(repo) });

      if (err?.message === 'Conflict') {
        return this.client.MergeRequests.all({
          sourceBranch,
          state: 'opened',
          targetBranch,
        }).then((res) => res[0]);
      }

      return Promise.reject(err);
    });

    await this.client.MergeRequests.merge(this.repo(repo), mergeRequestRes.iid).catch(async (err) => {
      logErrorWarn(err, 'GitlabIntegrationService.merge', { sourceBranch, targetBranch, repo: this.repo(repo) });

      if (err?.message === 'Method Not Allowed') {
        const mergeRequestCommitsRes = await this.client.MergeRequests.allCommits(this.repo(repo), mergeRequestRes.iid);

        if (!mergeRequestCommitsRes.length) { // no changes in MR
          return this.client.MergeRequests.remove(this.repo(repo), mergeRequestRes.iid);
        }
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async tagCreate(sha, tag, commitMessage?, repo?, org?, noRecreate?) {
    return this.client.Tags.create(this.repo(repo), tag, sha, { message: commitMessage ?? tag }).catch(async (err) => {
      logErrorWarn(err, 'GitlabIntegrationService.tagCreate', { sha, tag, commitMessage, repo: this.repo(repo) });

      if (err?.message === 'Bad Request' && !noRecreate) { // try to replace existing tag
        await this.client.Tags.remove(this.repo(repo), tag);

        return this.tagCreate(sha, tag, commitMessage, repo, org, true);
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async userGet(username) {
    return (await this.client.Users.all({ username }))?.[0];
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
