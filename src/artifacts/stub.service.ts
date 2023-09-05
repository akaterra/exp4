import { Inject, Service } from 'typedi';
import { BaseArtifactService, IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import {GithubIntegrationService} from '../integrations/github';

@Service()
export class StubArtifactService extends BaseArtifactService {
  static readonly type: string = '*';

  async exec(
    entity: { artifact: IProjectArtifact, ref: IProjectArtifact['ref'] },
  ): Promise<void> {

  }
}
