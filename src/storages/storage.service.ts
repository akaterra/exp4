import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { User } from '../user';

export interface IStorageService extends IService {
  userGet(id: string, type: string): Promise<User>;

  varGet<D extends any = any>(target: IProjectTargetDef, key: string | string[], def: D): Promise<D>;

  varSet<D extends any = any>(target: IProjectTargetDef, key: string | string[], val: D): Promise<void>;

  varGetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], def: D): Promise<D>;

  varSetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], val: D): Promise<void>;
}
