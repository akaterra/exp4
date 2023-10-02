import { IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { StreamState } from '../stream';

export interface IArtifactService extends IService {
  run(
    entity: { ref: IProjectArtifact['ref'], context?: Record<string, unknown> },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
  ): Promise<void>;
}
