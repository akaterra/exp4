import { IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { IStream } from '../stream';

export interface IArtifactService extends IService {
  run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: IStream,
    params?: Record<string, any>,
  ): Promise<void>;
}
