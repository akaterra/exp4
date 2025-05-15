import { Service } from 'typedi';
import { IArtifactService } from '.';
import { IProjectArtifact, IProjectDef } from '../project';
import { EntityService } from '../entities.service';
import { Autowired, hasScope } from '../utils';
import { ProjectsService } from '../projects.service';
import { Cache } from '../cache';
import { IStreamStateContext, StreamState } from '../stream-state';
import { JenkinsIntegrationService } from '../integrations/jenkins';

export interface IJenkinsJobHistoryArtifactConfig {
  integration: IProjectDef['id'];
  cacheTtlSec?: number;
};

@Service()
export class JenkinsJobHistoryArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'jenkins:jobHistory';

  @Autowired() protected projectsService: ProjectsService;
  protected cache = new Cache();

  constructor(public readonly config?: IJenkinsJobHistoryArtifactConfig) {
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
      artifact = await this.getIntegration(entity.ref).jobHistoryGet();
    }

    if (entity.context) {
      entity.context.argocdApplication = artifact;
    }

    this.cache.set(this.config?.integration, artifact, this.config?.cacheTtlSec ?? 60);
  }

  private getIntegration(ref: IProjectArtifact['ref']): JenkinsIntegrationService {
    return this.config?.integration
      ? this.projectsService
        .get(ref?.projectId)
        .getEnvIntegraionByIntegration<JenkinsIntegrationService>(this.config?.integration, 'jenkins')
      : this.projectsService
        .get(ref?.projectId)
        .getEnvIntegraionByTargetAndStream<JenkinsIntegrationService>(
          ref?.targetId,
          ref?.streamId,
          'jenkins',
        );
  }
}
