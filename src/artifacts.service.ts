import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from './entities.service';
import { IArtifactService } from './artifacts/artifact.service';

@Service()
export class ArtifactsService extends EntitiesServiceWithFactory<IArtifactService> {
  get domain() {
    return 'Artifact';
  }
}
