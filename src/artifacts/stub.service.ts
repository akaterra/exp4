import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact } from '../project';
import { EntityService } from '../entities.service';

@Service()
export class StubArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = '*';

  async run(
    entity: { artifact: IProjectArtifact, ref: IProjectArtifact['ref'], context?: Record<string, unknown> },
  ): Promise<void> {

  }
}
