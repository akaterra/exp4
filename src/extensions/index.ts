import {Service} from 'typedi';
import { EntitiesServiceWithFactory, IEntityService, IService } from '../entities.service';
import {TargetState} from '../target-state';

export interface IExtensionService extends IEntityService {
  exec(op?: string, ...args: any[]): Promise<void>;
}

@Service()
export class ExtensionHolderService extends EntitiesServiceWithFactory<IExtensionService> {
  get domain() {
    return 'Extension';
  }
}

export interface INotificationService extends IExtensionService {
  publishRelease(targetState: TargetState);
}
