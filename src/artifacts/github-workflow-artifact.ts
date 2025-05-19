import { Service } from 'typedi';
import { IArtifactService } from '.';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStreamStateContext, StreamState } from '../stream-state';
import { GithubIntegrationService } from '../integrations/github';
import { EntityService } from '../entities.service';
import { Autowired, hasScope } from '../utils';
import { ProjectsService } from '../projects.service';
import { Cache } from '../cache';
import { Status } from '../enums/status';
import AdmZip from 'adm-zip';

export interface IGithubWorkflowArtifactArtifactConfig {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
  name: string;
  file: string;
  saveAs?: string;
};

@Service()
export class GithubWorkflowArtifactArtifactService extends EntityService<IGithubWorkflowArtifactArtifactConfig> implements IArtifactService {
  static readonly type: string = 'github:workflowArtifact';

  @Autowired() protected projectsService: ProjectsService;
  protected cache = new Cache();

  // constructor(public readonly config?: IGithubWorkflowArtifactArtifactConfig) {
  //   super();
  // }

  // @Log('debug')
  async run(
    entity: { ref: IProjectArtifact['ref'], context?: IStreamStateContext },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
  ): Promise<void> {
    if (!params?.githubWorkflowId) {
      return;
    }

    if (![ Status.COMPLETED, Status.FAILED, Status.SUCCESS ].includes(params?.githubWorkflowRunJobStatus as Status)) {
      return;
    }

    let artifact = hasScope('artifact', scopes)
      ? null
      : this.cache.get(params.githubWorkflowId as string);

    if (!artifact) {
      artifact = await this.getIntegration(entity.ref).workflowArtifactList(
        params?.githubWorkflowId,
        entity.ref?.streamId,
      );
    }

    if (!artifact) {
      return;
    }

    this.cache.set(params.githubWorkflowId as string, artifact, this.config?.cacheTtlSec ?? 3600);

    const artifactId = artifact?.find((artifact) => artifact.name === this.config?.name)?.id;

    if (!artifactId) {
      return;
    }

    let artifactContent = hasScope('artifact', scopes)
      ? null
      : this.cache.get(`${params.githubWorkflowId}:${artifactId}`);
    
    if (!artifactContent) {
      artifactContent = await this.getIntegration(entity.ref).workflowArtifactGet(
        artifactId,
        entity.ref?.streamId,
      );
    }

    if (!artifactContent) {
      return;
    }

    this.cache.set(`${params.githubWorkflowId}:${artifactId}`, artifactContent, this.config?.cacheTtlSec ?? 3600);

    if (entity.context) {
      const zip = new AdmZip(Buffer.from(artifactContent));
      const zipEntry = zip.getEntries().find((entry) => entry.entryName === this.config?.file);
  
      if (zipEntry) {
        entity.context.githubWorkflowArtifact = zip.readAsText(zipEntry).trim();

        if (this.config?.saveAs) {
          const artifact = {
            id: this.config.saveAs,
            type: this.type,
            author: null,
            description: entity.context.githubWorkflowArtifact as string,
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
        .getEnvIntegraionByIntegration<GithubIntegrationService>(this.config?.integration, 'github')
      : this.projectsService
        .get(ref?.projectId)
        .getEnvIntegraionByTargetAndStream<GithubIntegrationService>(
          ref?.targetId,
          ref?.streamId,
          'github',
        );
  }
}
