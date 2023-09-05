import { Service } from 'typedi';
import { BaseArtifactService } from './artifact.service';
import { IProjectArtifact } from '../project';

@Service()
export class StubArtifactService extends BaseArtifactService {
  static readonly type: string = '*';

  async exec(
    entity: { artifact: IProjectArtifact, ref: IProjectArtifact['ref'] },
  ): Promise<void> {

  }
}
