import { IEntityService, IService } from '../entities.service';
import { IGeneralManifest } from '../general';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { StreamState } from '../stream-state';
import { TargetState } from '../target-state';
import { IUser } from '../user';
import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from '../entities.service';

export interface IStorageService extends IEntityService {
  manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>>;

  userGet(filter: Record<string, unknown>): Promise<IUser>;

  userGetByKeyAndType(id: string, type: string): Promise<IUser>;

  userSetByKeyAndType(id: string, type: string, data: Record<string, unknown>): Promise<void>;

  varGetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], def: D, isObject?: boolean): Promise<D>;

  varSetTarget<D>(target: IProjectTargetDef | TargetState, key: string | string[], val: D, isObject?: boolean): Promise<void>;

  varAddTarget<D>(
    target: IProjectTargetDef | TargetState,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D>;

  varIncTarget(target: IProjectTargetDef | TargetState, key: string | string[], add: number): Promise<number>;

  varGetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], def: D, isObject?: boolean): Promise<D>;

  varSetStream<D>(stream: IProjectTargetStreamDef | StreamState, key: string | string[], val: D, isObject?: boolean): Promise<void>;

  varAddStream<D>(
    stream: IProjectTargetStreamDef | StreamState,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D>;

  varIncStream(stream: IProjectTargetStreamDef | StreamState, key: string | string[], add: number): Promise<number>;

  truncateAll(): Promise<void>;
}

@Service()
export class StorageHolderService extends EntitiesServiceWithFactory<IStorageService> {
  get domain() {
    return 'Storage';
  }
}
