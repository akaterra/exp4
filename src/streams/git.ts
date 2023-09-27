import { IStreamService } from './stream.service';
import { IProjectTarget, IProjectTargetStream } from '../project';
import { StreamState } from '../stream';
import { Service } from 'typedi';
import { TargetState } from '../target';
import { EntityService } from '../entities.service';
import { hasScope } from '../utils';
import { GitIntegrationService } from '../integrations/git';
import { AwaitedCache } from '../cache';
import { Log, logError } from '../logger';

export type IGitTargetStream = IProjectTargetStream<{
  integration?: string;
  branch: string;
}, 'git'>;

export type IGitStream = StreamState<{
  sha: string;
  branch: string;
}>;

@Service()
export class GitStreamService extends EntityService implements IStreamService {
  static readonly type: string = 'git';

  protected cache = new AwaitedCache<StreamState>();

  actionRun(id: string) { // eslint-disable-line

  }

  @Log('debug')
  async streamBookmark(stream: IGitTargetStream): Promise<StreamState> {
    const project = this.projectsService.get(stream.ref?.projectId);

    project.env.streams.assertTypes(stream.type, this.type);

    const source = await this.projectsService
      .get(stream.ref?.projectId)
      .getStreamStateByTargetIdAndStreamId(stream.ref?.targetId, stream.ref?.streamId, { change: true });

    if (!source?.history?.change?.[0]?.id) {
      return;
    }

    const integration = this.getIntegrationService(stream);

    await integration.tagCreate(
      source?.history?.change?.[0]?.id,
      source.version,
      null,
      null, // stream?.config?.repo ?? stream?.id,
      null,
    );

    return null;
  }

  @Log('debug')
  async streamDetach(stream: IGitTargetStream): Promise<StreamState> {
    const integration = this.getIntegrationService(stream);
    const branchName = await this.getBranch(stream);

    await integration.branchDelete(branchName);

    return null;
  }

  @Log('debug')
  async streamGetState(stream: IGitTargetStream, scopes?: Record<string, boolean>): Promise<StreamState> {
    const cacheKey = `${stream.ref?.projectId}:${stream.ref?.targetId}:${stream.ref?.streamId}`;
    const state: StreamState = await this.cache.get(cacheKey) ?? new StreamState({
      id: stream.id,
      type: this.type,

      projectId: stream.ref.projectId,
      targetId: stream.ref.targetId,

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
      const branch = hasScope('change', scopes) ? await integration.branchGet(branchName) : null;
      const versioningService = await this.projectsService
        .get(stream.ref.projectId)
        .getEnvVersioningByTargetId(stream.ref.targetId);

      const metadata = {
        // org: stream.config?.org ?? integration.config?.org,
        branch: branchName,
      };

      if (hasScope('change', scopes)) {
        state.history.change = branch ? [ {
          id: branch.latest?.hash,
          type: `${this.type}:commit`,

          author: {
            name: branch.latest?.author_name ?? null,
            link: null,
          },
          description: branch.latest?.message ?? null,
          link: null,
          metadata: {},
          status: null,
          steps: null,
          time: branch.latest?.date ? new Date(branch.latest?.date as string) : null,
        } ] : [];
      }

      state.link = null;
      state.metadata = metadata;
      state.version = await versioningService.getCurrentStream(stream);
  
      if (hasScope('artifact', scopes) && stream.artifacts?.length) {
        await this.getArtifactsService(stream).run(
          { artifacts: stream.artifacts, ref: stream.ref },
          state,
          {
            ref: stream.ref,
          },
        );
      }
    })().catch((err) => {
      logError(err, 'GitStreamService.streamGetState');
    }).finally(() => {
      state.isSyncing = false;
    });

    this.cache.set(cacheKey, state);

    if (stream.isDirty) {
      await detailsPromise;
    }

    return state;
  }

  @Log('debug')
  async streamMove(sourceStream: IGitTargetStream, targetStream: IGitTargetStream) {
    const project = this.projectsService.get(sourceStream.ref?.projectId);

    project.env.streams.assertTypes(sourceStream.type, targetStream.type);

    const source = await this.projectsService
      .get(sourceStream.ref?.projectId)
      .getStreamStateByTargetIdAndStreamId(sourceStream.ref?.targetId, sourceStream.ref?.streamId, { change: true });

    if (!source?.history?.change?.[0]?.id) {
      return;
    }

    const sourceBranchName = await this.getBranch(sourceStream);
    const targetBranchName = await this.getBranch(targetStream);

    const targetIntegration = project.getEnvIntegraionByTargetStream<GitIntegrationService>(targetStream);

    if (!await targetIntegration.branchGet(
      targetBranchName,
    )) {
      await targetIntegration.branchCreate(
        targetBranchName,
        source.history.change[0]?.id,
      );
    } else {
      await targetIntegration.merge(
        sourceBranchName,
        targetBranchName,
        `Release ${source.version}`,
      );
    }
  }

  @Log('debug')
  async targetGetState(config: IProjectTarget): Promise<TargetState> {
    return {
      id: config.id,
      type: null,
    };
  }

  private getArtifactsService(stream: IGitTargetStream) {
    return this.projectsService.get(stream.ref.projectId).env.artifacts;
  }

  private getIntegrationService(stream: IGitTargetStream) {
    return this.projectsService
      .get(stream.ref.projectId)
      .getEnvIntegraionByTargetStream<GitIntegrationService>(stream, this.type);
  }

  private async getBranch(stream: IGitTargetStream) {
    const project = this.projectsService.get(stream.ref.projectId);
    const integration = project.getEnvIntegraionByTargetStream<GitIntegrationService>(stream);
    const target = project.getTargetByTargetStream(stream);
    const branch = await project.getEnvVersioningByTarget(target)
      .getCurrent(target, stream.config?.branch ?? integration.config?.branch);

    return branch ?? integration?.config?.branch;
  }
}
