import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { IIntegrationService, IncStatistics } from '.';
import { request } from '../utils';
import { Log } from '../logger';
import {maybeReplaceEnvVars} from './utils';

export interface ISlackConfig {
  webhookUrl: string;
}

@Service()
export class SlackIntegrationService extends EntityService implements IIntegrationService {
  static readonly type: string = 'slack';

  constructor(public readonly config: ISlackConfig) {
    super();

    this.config = {
      ...this.config,
      webhookUrl: maybeReplaceEnvVars(this.config.webhookUrl) || process.env.SLACK_WEBHOOK_URL,
    };
  }

  @Log('debug') @IncStatistics()
  send(message: string | {
    text?: string;
    blocks?: {
      type: string;
      block_id?: string;
      text: {
        type: 'text' | 'mrkdwn';
        text: string;
      };
    }[];
  }, channel?: string): Promise<void> {
    return request(this.config.webhookUrl, typeof message === 'string' ? {
      text: message,
    } : message, 'post');
  }
}
