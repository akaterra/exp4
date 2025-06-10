import { IEntityService, IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { IStreamStateContext, StreamState } from '../stream-state';
import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from '../entities.service';
import { Autowired } from '../utils';
import { ProjectsService } from '../projects.service';

export interface IArtifactService extends IEntityService {
  run(
    entity: { ref: IProjectArtifact['ref'], context?: IStreamStateContext },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
  ): Promise<void>;
}

@Service()
export class ArtifactHolderService extends EntitiesServiceWithFactory<IArtifactService> {
  @Autowired() protected projectsService: ProjectsService;

  get domain() {
    return 'Artifact';
  }

  async run(
    entity: { artifacts: IProjectArtifact['id'][], ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
  ) {
    return this.runWithDependences(entity, streamState, params, scopes);
  }

  private async runWithDependences(
    entity: { artifacts: IProjectArtifact['id'][], ref: IProjectArtifact['ref'], context?: Record<string, any> },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
    wasRun?: Record<string, boolean>,
  ) {
    if (!entity.artifacts?.length) {
      return;
    }

    if (!wasRun) {
      wasRun = {};
    }

    const project = this.projectsService.get(entity.ref?.projectId);
    const context = entity.context ?? {};

    for (const artifactId of entity.artifacts) {
      const artifact = project.getArtifactByArtifact(artifactId);

      if (artifact.dependsOn?.length) {
        for (const artifactId of artifact.dependsOn) {
          if (!wasRun[artifactId]) {
            wasRun[artifactId] = true;

            await this.runWithDependences(
              { artifacts: [ artifactId ], ref: entity.ref, context },
              streamState,
              params,
              scopes,
              wasRun,
            );
          }
        }
      }

      await project.getEnvArtifactByArtifact(artifactId).run(
        { ref: entity.ref, context },
        streamState,
        params,
        scopes,
      );
    }
  };
}
