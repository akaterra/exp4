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
import AdmZip from 'adm-zip';

export type IGithubWorkflowArtifactArtifactConfig = {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
  name: string;
  file: string;
  saveAs?: string;
};

@Service()
export class GithubWorkflowArtifactArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'github:workflowArtifact';

  @Autowired() protected projectsService: ProjectsService;
  protected cache = new AwaitedCache();

  constructor(public readonly config?: IGithubWorkflowArtifactArtifactConfig) {
    super();
  }

  async run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: StreamState,
    params?: Record<string, any>,
  ): Promise<void> {
    if (!params?.githubWorkflowId) {
      return;
    }

    if (![ Status.FAILED, Status.COMPLETED ].includes(params?.githubWorkflowRunJobStatus)) {
      return;
    }

    const resultArtifacts = this.cache.get(params.githubWorkflowId) ??
      await this.getIntegration(entity.ref).workflowArtifactsGet(
        params?.githubWorkflowId,
        entity.ref?.streamId,
      );

    if (!resultArtifacts) {
      return;
    }

    this.cache.set(params.githubWorkflowId, resultArtifacts, this.config?.cacheTtlSec ?? 3600);

    const artifactId = resultArtifacts?.find((artifact) => artifact.name === this.config?.name)?.id;

    if (!artifactId) {
      return;
    }

    const resultArtifactContent = this.cache.get(`${params.githubWorkflowId}:${artifactId}`) ??
      await this.getIntegration(entity.ref).workflowArtifactGet(
        artifactId,
        entity.ref?.streamId,
      );

    if (!resultArtifactContent) {
      return;
    }

    this.cache.set(`${params.githubWorkflowId}:${artifactId}`, resultArtifactContent, this.config?.cacheTtlSec ?? 3600);

    if (entity.scope) {
      const zip = new AdmZip(Buffer.from(resultArtifactContent));
      const zipEntry = zip.getEntries().find((entry) => entry.entryName === this.config?.file);
  
      if (zipEntry) {
        entity.scope.githubWorkflowArtifact = zip.readAsText(zipEntry);

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
