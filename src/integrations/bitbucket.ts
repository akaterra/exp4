import { Bitbucket, APIClient } from 'bitbucket';
import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Log, logErrorWarn } from '../logger';
import { maybeReplaceEnvVars } from './utils';

export interface IBitbucketConfig {
  authMethod?: 'password' | 'token';
  branch?: string;
  host?: string;
  password?: string;
  repository?: string;
  token?: string;
  useRepositoryAsOrg?: boolean;
  username?: string;
  workspace?: string;
}

@Service()
export class BitbucketIntegrationService extends EntityService implements IIntegrationService {
  protected client: APIClient;

  static readonly type: string = 'bitbucket';

  constructor(public readonly config?: IBitbucketConfig) {
    super();

    const isAuthMethodPassword = !config?.authMethod || config?.authMethod === 'password';
    const password = maybeReplaceEnvVars(config?.username) ?? process.env.BITBUCKET_PASSWORD;
    const token = maybeReplaceEnvVars(config?.token) ?? process.env.BITBUCKET_TOKEN;
    const username = maybeReplaceEnvVars(config?.username) ?? process.env.BITBUCKET_USERNAME;

    this.client = password && username && isAuthMethodPassword
      ? new Bitbucket({ auth: { password, username } })
      : new Bitbucket({ auth: { token } });
  }

  @IncStatistics() @Log('debug')
  async branchCreate(branch, sha, repo?, workspace?) {
    return (await this.client.refs.createBranch({
      _body: { name: this.branch(branch), target: { hash: sha } },
      repo_slug: this.repo(repo),
      workspace: this.workspace(workspace),
    }))?.data;
  }

  @IncStatistics() @Log('debug')
  async branchDelete(branch, repo?, workspace?) {
    return (await this.client.refs.deleteBranch({
      name: this.branch(branch),
      repo_slug: this.repo(repo),
      workspace: this.workspace(workspace),
    }).catch((err) => {
      if (err?.message === 'Not Found') {
        return null;
      }

      return Promise.reject(err);
    }))?.data;
  }

  @IncStatistics() @Log('debug')
  async branchGet(branch?, repo?, workspace?) {
    return (await this.client.refs.getBranch({
      name: this.branch(branch),
      repo_slug: this.repo(repo),
      workspace: this.workspace(workspace),
    }).catch((err) => {
      if (err?.message === 'Not Found') {
        return null;
      }

      return Promise.reject(err);
    }))?.data;
  }

  @IncStatistics() @Log('debug')
  async orgMembersList() {
    return [];
  }

  @IncStatistics() @Log('debug')
  async merge(sourceBranch, targetBranch, commitMessage?, repo?, workspace?) {
    const pullRequestRes = (await this.client.pullrequests.create({
      _body: {
        type: 'pullrequest',

        destination: {
          branch: { name: targetBranch },
        },
        source: {
          branch: { name: sourceBranch },
        },
        title: commitMessage,
      },
      repo_slug: this.repo(repo),
      workspace: this.workspace(workspace),
    }).catch((err) => {
      logErrorWarn(err, 'BitbucketIntegrationService.merge', { sourceBranch, targetBranch, repo: this.repo(repo), workspace: this.workspace(workspace) });

      if (err?.error?.error?.message === 'There are no changes to be pulled') {
        return null;
      }

      return Promise.reject(err);
    }))?.data;

    if (pullRequestRes) {
      await this.client.pullrequests.merge({
        pull_request_id: pullRequestRes.id,
        repo_slug: this.repo(repo),
        workspace: this.workspace(workspace),
      });
    }
  }

  @IncStatistics() @Log('debug')
  async tagCreate(sha, tag, commitMessage?, repo?, workspace?) {
    return (await this.client.refs.createTag({
      _body: { name: tag, target: { hash: sha } } as any,
      repo_slug: this.repo(repo),
      workspace: this.workspace(workspace),
    }).catch(async (err) => {
      logErrorWarn(err, 'BitbucketIntegrationService.tagCreate', { sha, tag, commitMessage, repo: this.repo(repo), workspace: this.workspace(workspace) });

      if (err?.error?.error?.message.includes('already exists')) {
        await this.client.refs.deleteTag({ name: tag, repo_slug: this.repo(repo), workspace: this.workspace(workspace) });

        return { data: await this.tagCreate(sha, tag, commitMessage, repo, workspace) };
      }

      return Promise.reject(err);
    }))?.data;
  }

  @IncStatistics() @Log('debug')
  async userGet(username) {
    return (await this.client.users.get({ selected_user: username }))?.data;
  }

  private branch(branch?) {
    return branch ?? this.config?.branch;
  }

  private repo(repo?) {
    return repo ?? this.config?.repository;
  }

  private workspace(workspace?) {
    return workspace ?? this.config?.workspace ?? this.config?.username;
  }
}
