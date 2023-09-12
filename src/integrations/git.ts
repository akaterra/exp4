import { simpleGit, SimpleGit, SimpleGitOptions } from 'simple-git';
import { IIntegrationService, IncStatistics } from './integration.service';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Log, logErrorWarn } from '../logger';

export interface IGitConfig {
  binary?: string;
  branch?: string;
  dir?: string;
  maxConcurrentProcesses?: number;
  trimmed?: boolean;
}

@Service()
export class GitIntegrationService extends EntityService implements IIntegrationService {
  protected client: SimpleGit;

  static readonly type: string = 'git';

  constructor(public readonly config?: IGitConfig) {
    super();

    this.client = simpleGit({
      baseDir: this.config?.dir ?? process.cwd(),
      binary: this.config?.binary ?? 'git',
      maxConcurrentProcesses: this.config?.maxConcurrentProcesses ?? 6,
      trimmed: this.config?.trimmed ?? false,
    });
  }

  @IncStatistics() @Log('debug')
  async branchCheckout(branch, repo?, org?) {
    return this.client.checkout(branch);
  }

  @IncStatistics() @Log('debug')
  async branchCreate(branch, sha, repo?, org?) {
    return this.client.checkoutLocalBranch(branch, [ sha ]).catch((err) => {
      logErrorWarn(err, 'GitIntegrationService.branchCreate', { branch: this.branch(branch) });

      if (err?.message?.includes('already exists')) {
        return null;
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async branchDelete(branch, repo?, org?) {
    await this.branchCreate('source_flow_tmp', 'HEAD');
    await this.branchCheckout('source_flow_tmp');
    await this.client.deleteLocalBranch(branch).catch((err) => {
      logErrorWarn(err, 'GitIntegrationService.branchDelete', { branch: this.branch(branch) });

      if (err?.message?.includes('not found')) {
        return null;
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async branchGet(branch?, repo?, org?) {
    return this.client.log([ this.branch(branch), '-1' ]).then(
      (res) => res.latest ? res : null
    ).catch((err) => {
      logErrorWarn(err, 'GitIntegrationService.branchGet', { branch: this.branch(branch) });

      if (err?.message?.includes('unknown revision or path not in the working tree')) {
        return null;
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async orgMembersList(org?) {
    return [];
  }

  @IncStatistics() @Log('debug')
  async merge(sourceBranch, targetBranch, commitMessage?, repo?, org?) {
    await this.client.mergeFromTo(sourceBranch, targetBranch);
  }

  @IncStatistics() @Log('debug')
  async tagCreate(sha, tag, commitMessage?, repo?, org?, noRecreate?) {
    await this.branchCheckout(sha);
    await this.client.addAnnotatedTag(tag, commitMessage).catch(async (err) => {
      logErrorWarn(err, 'GitIntegrationService.tagCreate', { sha, tag, commitMessage });

      if (err?.message?.includes('already exists') && !noRecreate) {
        await this.client.tag([ '-d', tag ]);

        return this.tagCreate(sha, tag, commitMessage, repo, org, true);
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async userGet(username) {
    return null;
  }

  private branch(branch?) {
    return branch ?? this.config?.branch;
  }
}
