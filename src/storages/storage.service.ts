import { IService } from '../entities.service';
import { IGeneralManifest } from '../general';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IUser } from '../user';

export interface IStorageService extends IService {
  manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>>;

  userGet(id: string, type: string): Promise<IUser>;

  userSet(id: string, type: string, data: Record<string, unknown>): Promise<void>;

  varGetTarget<D>(target: IProjectTargetDef, key: string | string[], def: D, isComplex?: boolean): Promise<D>;

  varSetTarget<D>(target: IProjectTargetDef, key: string | string[], val: D, isComplex?: boolean): Promise<void>;

  varAddTarget<D>(
    target: IProjectTargetDef,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D>;

  varIncTarget(target: IProjectTargetDef, key: string | string[], add: number): Promise<number>;

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
