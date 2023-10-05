import { IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { IStreamStateContext, StreamState } from '../stream';

export interface IArtifactService extends IService {
  run(
    entity: { ref: IProjectArtifact['ref'], context?: IStreamStateContext },
    streamState: StreamState,
    params?: Record<string, unknown>,
    scopes?: Record<string, boolean>,
  ): Promise<void>;
}
