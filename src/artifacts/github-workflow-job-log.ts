import { Service } from 'typedi';
import { BaseArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import { GithubIntegrationService } from '../integrations/github';

export type IGithubActionStepLogArtifact = IProjectArtifact<{
  integration: IProjectDef['id'];
}>

@Service()
export class GithubActionStepLogArtifactService extends BaseArtifactService {
  static readonly type: string = 'github:workflowJob:log';

  async exec(
    entity: { artifact: IGithubActionStepLogArtifact, ref: IProjectArtifact['ref'] },
    buckets: IStream['history']['artifact'],
    params?: Record<string, any>,
  ): Promise<void> {
    const result = await this.getIntegration(entity.ref).gitGetWorkflowJobLog(
      params?.job_id,
      entity.ref?.streamId,
    );

    console.log({ result });
  }

  private getIntegration(ref: IGithubActionStepLogArtifact['ref']): GithubIntegrationService {
    return this.projectsService
      .get(ref?.projectId)
      .getEnvIntegraionByTargetIdAndStreamId<GithubIntegrationService>(
        ref?.targetId,
        ref?.streamId,
        'github',
      );
  }
}
