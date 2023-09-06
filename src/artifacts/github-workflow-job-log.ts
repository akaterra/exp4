import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import { GithubIntegrationService } from '../integrations/github';
import {EntityService} from '../entities.service';
import {Autowired} from '../utils';
import {ProjectsService} from '../projects.service';

export type IGithubActionStepLogArtifactConfig = {
  integration: IProjectDef['id'];
};

@Service()
export class GithubActionStepLogArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = 'github:workflowJob:log';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: IGithubActionStepLogArtifactConfig) {
    super();
  }

  async run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: IStream,
    params?: Record<string, any>,
  ): Promise<void> {
    const result = await this.getIntegration(entity.ref).gitGetWorkflowJobLog(
      params?.job_id,
      entity.ref?.streamId,
    );

    if (entity.scope) {
      entity.scope.gitWorkflowJobLog = result;
    }
  }

  private getIntegration(ref: IProjectArtifact['ref']): GithubIntegrationService {
    return this.config?.integration
      ? this.projectsService
          .get(ref?.projectId)
          .getEnvIntegraionByIntegrationId<GithubIntegrationService>(this.config?.integration)
      : this.projectsService
          .get(ref?.projectId)
          .getEnvIntegraionByTargetIdAndStreamId<GithubIntegrationService>(
            ref?.targetId,
            ref?.streamId,
            'github',
          );
  }
}
