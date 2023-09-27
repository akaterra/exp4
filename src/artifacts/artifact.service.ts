import { IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { StreamState } from '../stream';

export interface IArtifactService extends IService {
  run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: StreamState,
    params?: Record<string, any>,
  ): Promise<void>;
}
