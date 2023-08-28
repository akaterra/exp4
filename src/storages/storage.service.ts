import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';

export interface IStorageService extends IService {
  varGet<D extends any = any>(target: IProjectTargetDef, key: string | string[], def: D): Promise<D>;

  varSet<D extends any = any>(target: IProjectTargetDef, key: string | string[], val: D): Promise<void>;

  varGetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], def: D): Promise<D>;

  varSetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], val: D): Promise<void>;
}
