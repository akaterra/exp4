import { Service } from 'typedi';
import { IArtifactService } from '.';
import { EntityService } from '../entities.service';

@Service()
export class StubArtifactService extends EntityService implements IArtifactService {
  static readonly type: string = '*';

  async run(): Promise<void> {

  }
}
