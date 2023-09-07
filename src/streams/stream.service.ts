import { IStream } from '../stream';
import { IProjectTarget, IProjectTargetStreamDef } from '../project';
import { ITarget } from '../target';
import { IService } from '../entities.service';

export interface IStreamService extends IService {
  actionRun(id: string);

  streamDetach(stream: IProjectTargetStreamDef): Promise<IStream>;

  streamGetState(stream: IProjectTargetStreamDef): Promise<IStream>;

  streamMove(sourceStream: IProjectTargetStreamDef, targetStream: IProjectTargetStreamDef);

  targetGetState(target: IProjectTarget): Promise<ITarget>;
}
