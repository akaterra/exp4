import { Service } from 'typedi';
import { EntitiesServiceWithFactory, IEntityService } from '../entities.service';
import { TargetState } from '../target-state';
import {CallbacksContainer} from '../utils';

export interface IExtensionService extends IEntityService {
  exec(op?: string, ...args: any[]): Promise<void>;
}

@Service()
export class ExtensionHolderService extends EntitiesServiceWithFactory<IExtensionService> {
  get domain() {
    return 'Extension';
  }

  constructor(public readonly callbacksContainer: CallbacksContainer = new CallbacksContainer()) {
    super();
  }
}

export interface INotificationService extends IExtensionService {
  publishRelease(targetState: TargetState);
}
