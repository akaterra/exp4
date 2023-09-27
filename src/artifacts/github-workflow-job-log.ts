import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { StreamState } from '../stream';
import { GithubIntegrationService } from '../integrations/github';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';
import { ProjectsService } from '../projects.service';
import { AwaitedCache } from '../cache';
import { Status } from '../enums/status';

export type IGithubWorkflowJobLogArtifactConfig = {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
  saveAs?: string;
};

@Service()
export class GithubWorkflowJobLogArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'github:workflowJob:log';

  @Autowired() protected projectsService: ProjectsService;
  protected cache = new AwaitedCache();

  constructor(public readonly config?: IGithubWorkflowJobLogArtifactConfig) {
    super();
  }

  async run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: StreamState,
    params?: Record<string, any>,
  ): Promise<void> {
    if (!params?.githubWorkflowJobId) {
      return;
    }

    if (![ Status.FAILED, Status.COMPLETED ].includes(params?.githubWorkflowRunJobStatus)) {
      return;
    }

    const resultJobLog = this.cache.get(params.githubWorkflowJobId)
      ?? await this.getIntegration(entity.ref).workflowJobLogGet(
        params?.githubWorkflowJobId,
        entity.ref?.streamId,
      );

    if (!resultJobLog) {
      return;
    }

    this.cache.set(params.githubWorkflowJobId, resultJobLog, this.config?.cacheTtlSec ?? 3600);

    if (entity.scope) {
      entity.scope.githubWorkflowJobLog = resultJobLog;

      if (this.config?.saveAs) {
        const artifact = {
          id: this.config.saveAs,
          type: this.type,
          author: null,
          description: entity.scope.githubWorkflowArtifact,
          link: null,
          metadata: {},
          steps: null,
          time: null,
        };

        streamState.pushArtifactUniq(artifact);
      }
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
