import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IUser } from '../user';

export interface IStorageService extends IService {
  userGet(id: string, type: string): Promise<IUser>;

  varGet<D extends any = any>(target: IProjectTargetDef, key: string | string[], def: D): Promise<D>;

  varSet<D extends any = any>(target: IProjectTargetDef, key: string | string[], val: D): Promise<void>;

  varAdd<D extends any = any>(target: IProjectTargetDef, key: string | string[], val: D): Promise<D>;

  varInc(target: IProjectTargetDef, key: string | string[], add: number): Promise<number>;

  varGetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], def: D): Promise<D>;

  varSetStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], val: D): Promise<void>;

  varAddStream<D extends any = any>(stream: IProjectTargetStreamDef, key: string | string[], val: D): Promise<D>;

  varIncStream(stream: IProjectTargetStreamDef, key: string | string[], add: number): Promise<number>;
}
