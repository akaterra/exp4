import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from '../entities.service';
import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { ReleaseState } from '../release-state';
import { TargetState } from '../target-state';

export interface IVersioningService extends IService {
  getCurrent(target: IProjectTargetDef, format?: false | string): Promise<string>;

  format(version: string, format?: string): Promise<any>;

  override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string>;

  patch(target: IProjectTargetDef, params?: Record<string, any>): Promise<string>;

  release(target: IProjectTargetDef, params?: Record<string, any>): Promise<string>;

  rollback(target: IProjectTargetDef, params?: Record<string, any>): Promise<string>;

  getCurrentStream(stream: IProjectTargetStreamDef, format?: false | string): Promise<string>;

  formatStream(version: string, format?: string): Promise<any>;

  overrideStream(source: IProjectTargetDef, target: IProjectTargetStreamDef): Promise<string>;

  patchStream(target: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string>;

  releaseStream(target: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string>;

  rollbackStream(target: IProjectTargetStreamDef, params?: Record<string, any>): Promise<string>;

  getCurrentRelease(target: IProjectTargetDef, format?: false | string): Promise<ReleaseState>;

  setCurrentRelease(targetState: TargetState): Promise<void>;

  exec(source: IProjectTargetDef, target: IProjectTargetDef, action: string): Promise<string>;
}

@Service()
export class VersioningHolderService extends EntitiesServiceWithFactory<IVersioningService> {
  get domain() {
    return 'Versioning';
  }

  getByTarget(target: IProjectTargetDef): IVersioningService {
    return this.get(target.versioning);
  }
}
