import {Service} from 'typedi';
import {EntityService} from '../entities.service';
import {IIntegrationService, IncStatistics} from '.';
import {request} from '../utils';
import {Log} from '../logger';

export interface ISlackConfig {
  webhookUrl: string;
}

@Service()
export class SlackIntegrationService extends EntityService implements IIntegrationService {
  static readonly type: string = 'slack';

  constructor(public readonly config?: ISlackConfig) {
    super();
  }

  @Log('debug') @IncStatistics()
  send(message: string | {
    type: string;
    block_id?: string;
    text: {
      type: 'text' | 'mrkdwn';
      text: string;
    };
  }[], channel?: string): Promise<void> {
    return request(this.config.webhookUrl, {
      text: message,
      channel: channel || '#general',
    }, 'post');
  }
}
