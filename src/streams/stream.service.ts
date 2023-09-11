import { IStream } from '../stream';
import { IProjectTarget, IProjectTargetStreamDef } from '../project';
import { ITarget } from '../target';
import { IService } from '../entities.service';

export interface IStreamService extends IService {
  actionRun(id: string);

  streamBookmark(stream: IProjectTargetStreamDef): Promise<IStream>;

  streamDetach(stream: IProjectTargetStreamDef): Promise<IStream>;

  streamGetState(stream: IProjectTargetStreamDef, scopes?: Record<string, boolean>): Promise<IStream>;

  streamMove(sourceStream: IProjectTargetStreamDef, targetStream: IProjectTargetStreamDef);

  targetGetState(target: IProjectTarget, scopes?: Record<string, boolean>): Promise<ITarget>;
}
