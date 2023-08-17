import { IService } from '../entities.service';
import { IProjectTargetDef } from '../project';

export interface IStorageService extends IService {
  varGet<D extends any = any>(stream: IProjectTargetDef, key: string | string[], def: D): Promise<D>;

  varSet<D extends any = any>(stream: IProjectTargetDef, key: string | string[], val: D): Promise<void>;
}
