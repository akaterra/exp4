import { Service } from 'typedi';
import { INotificationService } from '.';
import { EntityService } from '../entities.service';
import { TargetState } from '../target-state';

@Service()
export class SlackNotificationService extends EntityService implements INotificationService {
  static readonly type: string = 'slack';

  constructor(protected config?: { integration?: string }) {
    super();
  }

  async publishRelease(targetState: TargetState): Promise<void> {
  }
}
