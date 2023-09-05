import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';

export interface IVersioningService extends IService {
  getCurrent(target: IProjectTargetDef, format?: string): Promise<string>;

  format(version: string, format?: string): Promise<any>;

  override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string>;

  patch(target: IProjectTargetDef, params?: Record<string, any>): Promise<string>;

  release(target: IProjectTargetDef, params?: Record<string, any>): Promise<string>;

  rollback(target: IProjectTargetDef, params?: Record<string, any>): Promise<string>;

  getCurrentStream(stream: IProjectTargetStreamDef, format?: string): Promise<string>;

  formatStream(version: string, format?: string): Promise<any>;

  overrideStream(source: IProjectTargetDef, target: IProjectTargetStreamDef): Promise<string>;

  patchStream(target: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string>;

  releaseStream(target: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string>;

  rollbackStream(target: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string>;

  exec(source: IProjectTargetDef, target: IProjectTargetDef, action: string): Promise<string>;
}
