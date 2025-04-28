import { Service } from 'typedi';
import { IArtifactService } from '.';
import { IProjectArtifact, IProjectDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired, hasScope } from '../utils';
import { ProjectsService } from '../projects.service';
import { ArgocdIntegrationService } from '../integrations/argocd';
import { AwaitedCache } from '../cache';
import { IStreamStateContext, StreamState } from '../stream-state';

export interface IArgocdApplicationArtifactConfig {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
};

@Service()
export class ArgocdApplicationArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'argocd:application';

  @Autowired() protected projectsService: ProjectsService;
  protected cache = new AwaitedCache();

  constructor(public readonly config?: IArgocdApplicationArtifactConfig) {
    super();
  }

  async run(
    entity: { ref: IProjectArtifact['ref'], context?: IStreamStateContext },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
  ): Promise<void> {
    let artifact = hasScope('artifact', scopes)
      ? null
      : this.cache.get(this.config?.integration);

    if (!artifact) {
      artifact = await this.getIntegration(entity.ref).applicationGet();
    }

    if (entity.context) {
      entity.context.argocdApplication = artifact;
    }

    this.cache.set(this.config?.integration, artifact, this.config?.cacheTtlSec ?? 60);
  }

  private getIntegration(ref: IProjectArtifact['ref']): ArgocdIntegrationService {
    return this.config?.integration
      ? this.projectsService
        .get(ref?.projectId)
        .getEnvIntegraionByIntegrationId<ArgocdIntegrationService>(this.config?.integration, 'argocd')
      : this.projectsService
        .get(ref?.projectId)
        .getEnvIntegraionByTargetIdAndStreamId<ArgocdIntegrationService>(
          ref?.targetId,
          ref?.streamId,
          'argocd',
        );
  }
}
