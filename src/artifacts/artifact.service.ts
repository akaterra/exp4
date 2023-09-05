import { Service } from 'typedi';
import { EntityService, IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { IStream } from '../stream';
import { Autowired } from '../utils';
import { ProjectsService } from '../projects.service';

export interface IArtifactService extends IService {
  exec(
    entity: { artifact: IProjectArtifact, ref: IProjectArtifact['ref'] },
    buckets: IStream['history']['artifact'],
    params?: Record<string, any>,
  ): Promise<void>;

  run(
    entity: { artifacts: IProjectArtifact['id'][], ref: IProjectArtifact['ref'] },
    buckets: IStream['history']['artifact'],
    params?: Record<string, any>,
  ): Promise<void>;
}

@Service()
export abstract class BaseArtifactService extends EntityService implements IArtifactService {
  @Autowired() protected projectsService: ProjectsService;

  abstract exec(
    entity: { artifact: IProjectArtifact, ref: IProjectArtifact['ref'] },
    buckets: IStream['history']['artifact'],
    params?: Record<string, any>,
  ): Promise<void>;

  async run(
    entity: { artifacts: IProjectArtifact['id'][], ref: IProjectArtifact['ref'] },
    buckets: IStream['history']['artifact'],
    params?: Record<string, any>,
  ) {
    if (!entity.artifacts) {
      return;
    }

    const project = this.projectsService.get(entity.ref?.projectId);

    for (const artifactId of entity.artifacts) {
      const artifactService = project.getEnvArtifactByArtifactId(artifactId);
      const artifact = project.getArtifactByArtifactId(artifactId);

      await artifactService.exec(
        { artifact, ref: entity.ref },
        buckets,
        params,
      );

      if (artifact.dependants?.length) {
        for (const artifactId of artifact.dependants) {
          const artifactService = project.getEnvArtifactByArtifactId(artifactId);

          await artifactService.run(
            { artifacts: [ artifactId ], ref: entity.ref },
            buckets,
            params,
          );
        }
      }
    }
  };
}
