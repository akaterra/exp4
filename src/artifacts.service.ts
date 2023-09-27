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
    params?: Record<string, any>,
  ) {
    return this.runWithDependences(entity, streamState, params);
  }

  private async runWithDependences(
    entity: { artifacts: IProjectArtifact['id'][], ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: StreamState,
    params?: Record<string, any>,
    isRun?: Record<string, boolean>,
  ) {
    if (!entity.artifacts?.length) {
      return;
    }

    if (!isRun) {
      isRun = {};
    }

    const project = this.projectsService.get(entity.ref?.projectId);
    const scope = entity.scope ?? {};

    for (const artifactId of entity.artifacts) {
      const artifact = project.getArtifactByArtifactId(artifactId);

      if (artifact.dependsOn?.length) {
        for (const artifactId of artifact.dependsOn) {
          if (!isRun[artifactId]) {
            isRun[artifactId] = true;

            await this.runWithDependences(
              { artifacts: [ artifactId ], ref: entity.ref, scope },
              streamState,
              params,
              isRun,
            );
          }
        }
      }

      await project.getEnvArtifactByArtifactId(artifactId).run(
        { ref: entity.ref, scope },
        streamState,
        params,
      );
    }
  };
}
