import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from './entities.service';
import { IArtifactService } from './artifacts/artifact.service';
import { Autowired } from './utils';
import { ProjectsService } from './projects.service';
import { StreamState } from './stream';
import { IProjectArtifact } from './project';

@Service()
export class ArtifactsService extends EntitiesServiceWithFactory<IArtifactService> {
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
      const artifact = project.getArtifactByArtifactId(artifactId);

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

      await project.getEnvArtifactByArtifactId(artifactId).run(
        { ref: entity.ref, context },
        streamState,
        params,
        scopes,
      );
    }
  };
}
