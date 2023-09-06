import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import { GithubIntegrationService } from '../integrations/github';
import {EntityService} from '../entities.service';
import {Autowired} from '../utils';
import {ProjectsService} from '../projects.service';
import {AwaitedCache} from '../cache';
import {Status} from '../enums/status';

export type IGithubActionStepLogArtifactConfig = {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
};

@Service()
export class GithubActionStepLogArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'github:workflowJob:log';

  @Autowired() protected projectsService: ProjectsService;
  protected cache = new AwaitedCache();

  constructor(public readonly config?: IGithubActionStepLogArtifactConfig) {
    super();
  }

  async run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: IStream,
    params?: Record<string, any>,
  ): Promise<void> {
    if (!params?.githubWorkflowRunJobId) {
      return;
    }

    if (![ Status.FAILED, Status.COMPLETED ].includes(params?.githubWorkflowRunJobStatus)) {
      return;
    }

    const result = this.cache.get(params.githubWorkflowRunJobId) ?? await this.getIntegration(entity.ref).gitGetWorkflowJobLog(
      params?.githubWorkflowRunJobId,
      entity.ref?.streamId,
    );

    this.cache.set(params.githubWorkflowRunJobId, result, this.config?.cacheTtlSec ?? 3600);

    if (entity.scope) {
      entity.scope.githubWorkflowRunJobLog = result;
    }
  }

  private getIntegration(ref: IProjectArtifact['ref']): GithubIntegrationService {
    return this.config?.integration
      ? this.projectsService
          .get(ref?.projectId)
          .getEnvIntegraionByIntegrationId<GithubIntegrationService>(this.config?.integration, 'github')
      : this.projectsService
          .get(ref?.projectId)
          .getEnvIntegraionByTargetIdAndStreamId<GithubIntegrationService>(
            ref?.targetId,
            ref?.streamId,
            'github',
          );
  }
}
