import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';

export interface IVersioningService extends IService {
  getCurrent(target: IProjectTargetDef): Promise<string>;

  format(target: IProjectTargetDef, entity: any): Promise<any>;

  override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string>;

  patch(target: IProjectTargetDef): Promise<string>;

  release(target: IProjectTargetDef): Promise<string>;

  getCurrentStream(stream: IProjectTargetStreamDef): Promise<string>;

  formatStream(target: IProjectTargetStreamDef, entity: any): Promise<any>;

  overrideStream(source: IProjectTargetDef, target: IProjectTargetStreamDef): Promise<string>;

  patchStream(target: IProjectTargetStreamDef): Promise<string>;

  releaseStream(target: IProjectTargetStreamDef): Promise<string>;

  exec(source: IProjectTargetDef, target: IProjectTargetDef, action: string): Promise<string>;
}
