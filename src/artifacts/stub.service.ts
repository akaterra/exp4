import { Service } from 'typedi';
import { IArtifactService } from '.';
import { IProjectArtifact } from '../project';
import { EntityService } from '../entities.service';
import { IStreamStateContext } from '../stream-state';

@Service()
export class StubArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = '*';

  async run(
    entity: { artifact: IProjectArtifact, ref: IProjectArtifact['ref'], context?: IStreamStateContext },
  ): Promise<void> {

  }
}
