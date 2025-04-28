import { Service } from 'typedi';
import { EntitiesServiceWithFactory, IService } from '../entities.service';
import { TargetState } from '../target-state';

export interface INotificationService extends IService {
  publishRelease(targetState: TargetState);
}

@Service()
export class NotificationHolderService extends EntitiesServiceWithFactory<INotificationService> {
  get domain() {
    return 'Notification';
  }
}
