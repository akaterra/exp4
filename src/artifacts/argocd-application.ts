import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import {EntityService} from '../entities.service';
import {Autowired} from '../utils';
import {ProjectsService} from '../projects.service';
import {ArgocdIntegrationService} from '../integrations/argocd';
import {AwaitedCache} from '../cache';

export type IGithubActionStepLogArtifactConfig = {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
};

@Service()
export class ArgocdApplicationArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'argocd:application';

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
    const result = this.cache.get(this.config?.integration) ?? await this.getIntegration(entity.ref).getApplication();

    if (entity.scope) {
      entity.scope.argocdApplication = result;
    }

    this.cache.set(this.config?.integration, result, this.config?.cacheTtlSec ?? 60);
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
