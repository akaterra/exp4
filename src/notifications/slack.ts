import {Service} from 'typedi';
import {INotificationService} from '.';
import {EntityService} from '../entities.service';

@Service()
export class SlackNotificationService extends EntityService implements INotificationService {
  static readonly type: string = 'slack';

  constructor(protected config?: { integration?: string }) {
    super();
  }

  async publishRelease(targetState: any): Promise<void> {
  }
}
