import { IService } from '../entities.service';
import { IProjectTargetDef } from '../project';

export interface IVersioningService extends IService {
  getCurrent(target: IProjectTargetDef): Promise<string>;

  format(target: IProjectTargetDef, entity: any): Promise<any>;

  override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string>;

  patch(target: IProjectTargetDef): Promise<string>;

  release(target: IProjectTargetDef): Promise<string>;

  exec(source: IProjectTargetDef, target: IProjectTargetDef, action: string): Promise<string> {

  }
}
