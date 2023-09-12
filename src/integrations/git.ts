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
  async branchCreate(branch, sha, repo?, org?) {
    return this.client.branch().checkoutLocalBranch(branch, [ 'b' ]);
  }

  @IncStatistics() @Log('debug')
  async branchDelete(branch, repo?, org?) {
    return this.client.branch().deleteLocalBranch(branch);
  }

  @IncStatistics() @Log('debug')
  async branchGet(branch?, repo?, org?) {
    // await this.client.branch().checkout(branch);

    return this.client.branch().log({ from: this.branch(branch), maxCount: 1 });
  }

  @IncStatistics() @Log('debug')
  async orgMembersList(org?) {
    return [];
  }

  @IncStatistics() @Log('debug')
  async merge(sourceBranch, targetBranch, commitMessage?, repo?, org?) {
    await this.client.branch().mergeFromTo(sourceBranch, targetBranch);
  }

  @IncStatistics() @Log('debug')
  async tagCreate(sha, tag, commitMessage?, repo?, org?, noRecreate?) {
    await this.client.tags().addTag(tag);
  }

  @IncStatistics() @Log('debug')
  async userGet(username) {
    return null;
  }

  private branch(branch?) {
    return branch ?? this.config?.branch;
  }
}
