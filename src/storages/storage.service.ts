import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IUser } from '../user';

export interface IStorageService extends IService {
  userGet(id: string, type: string): Promise<IUser>;

  userSet(id: string, type: string, data: Record<string, unknown>): Promise<void>;

  varGet<D>(target: IProjectTargetDef, key: string | string[], def: D, isComplex?: boolean): Promise<D>;

  varSet<D>(target: IProjectTargetDef, key: string | string[], val: D, isComplex?: boolean): Promise<void>;

  varAdd<D>(
    target: IProjectTargetDef,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D>;

  varInc(target: IProjectTargetDef, key: string | string[], add: number): Promise<number>;

  varGetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], def: D, isComplex?: boolean): Promise<D>;

  varSetStream<D>(stream: IProjectTargetStreamDef, key: string | string[], val: D, isComplex?: boolean): Promise<void>;

  varAddStream<D>(
    stream: IProjectTargetStreamDef,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D>;

  varIncStream(stream: IProjectTargetStreamDef, key: string | string[], add: number): Promise<number>;
}
