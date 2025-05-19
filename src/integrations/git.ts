import { simpleGit, SimpleGit } from 'simple-git';
import { IIntegrationService, IncStatistics } from '.';
import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { Log, logErrorWarn } from '../logger';
import { maybeReplaceEnvVars } from './utils';

export interface IGitConfig {
  binary?: string;
  branch?: string;
  dir?: string;
  maxConcurrentProcesses?: number;
  trimmed?: boolean;
}

@Service()
export class GitIntegrationService extends EntityService<IGitConfig> implements IIntegrationService {
  protected client: SimpleGit;

  static readonly type: string = 'git';

  // constructor(public readonly config?: IGitConfig) {
  //   super();

  //   this.client = simpleGit({
  //     baseDir: maybeReplaceEnvVars(this.config?.dir) ?? process.cwd(),
  //     binary: maybeReplaceEnvVars(this.config?.binary) ?? 'git',
  //     maxConcurrentProcesses: this.config?.maxConcurrentProcesses ?? 6,
  //     trimmed: this.config?.trimmed ?? false,
  //   });
  // }

  onConfigBefore(config: IGitConfig): IGitConfig {
    return {
      ...config,
      binary: maybeReplaceEnvVars(config.binary) || process.env.GIT_BINARY,
      dir: maybeReplaceEnvVars(config.dir) || process.env.GIT_DIR,
    };
  }

  onConfigAfter(config: IGitConfig): IGitConfig {
    this.client = simpleGit({
      baseDir: maybeReplaceEnvVars(config.dir) ?? process.cwd(),
      binary: maybeReplaceEnvVars(config.binary) ?? 'git',
      maxConcurrentProcesses: config?.maxConcurrentProcesses ?? 6,
      trimmed: config?.trimmed ?? false,
    });

    return config;
  }

  @IncStatistics() @Log('debug')
  async branchCheckout(branch) {
    return this.client.checkout(branch);
  }

  @IncStatistics() @Log('debug')
  async branchCreate(branch, sha) {
    return this.client.checkoutLocalBranch(branch, [ sha ]).catch((err) => {
      logErrorWarn(err, 'GitIntegrationService.branchCreate', { branch: this.branch(branch) });

      if (err?.message?.includes('already exists')) {
        return null;
      }

      return Promise.reject(err);
    });
  }

  @IncStatistics() @Log('debug')
  async branchDelete(branch) {
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
  async branchGet(branch?) {
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
  async orgMembersList() {
    return [];
  }

  @IncStatistics() @Log('debug')
  async merge(sourceBranch, targetBranch, commitMessage?) {
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
  async userGet() {
    return null;
  }

  private branch(branch?) {
    return branch ?? this.config?.branch;
  }
}
