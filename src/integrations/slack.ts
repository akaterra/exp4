import { Service } from 'typedi';
import { EntityService } from '../entities.service';
import { IIntegrationService, IncStatistics } from '.';
import { request } from '../utils';
import { Log, logger } from '../logger';
import { maybeReplaceEnvVars } from './utils';

export interface ISlackConfig {
  oauthToken?: string;
  channelId?: string;
  channelMessageId?: string;
  webhookUrl?: string;
}

@Service()
export class SlackIntegrationService extends EntityService<ISlackConfig> implements IIntegrationService {
  static readonly type: string = 'slack';

  // constructor(public readonly config: ISlackConfig) {
  //   super();

  //   this.config = {
  //     ...this.config,
  //     oauthToken: maybeReplaceEnvVars(this.config.oauthToken) || process.env.SLACK_OAUTH_TOKEN,
  //     channelId: maybeReplaceEnvVars(this.config.channelId) || process.env.SLACK_CHANNEL_ID,
  //     channelMessageId: maybeReplaceEnvVars(this.config.channelMessageId) || process.env.SLACK_CHANNEL_MESSAGE_ID,
  //     webhookUrl: maybeReplaceEnvVars(this.config.webhookUrl) || process.env.SLACK_WEBHOOK_URL,
  //   };
  // }

  onConfigBefore(config: ISlackConfig): ISlackConfig {
    return {
      ...config,
      oauthToken: maybeReplaceEnvVars(config.oauthToken) || process.env.SLACK_OAUTH_TOKEN,
      channelId: maybeReplaceEnvVars(config.channelId) || process.env.SLACK_CHANNEL_ID,
      channelMessageId: maybeReplaceEnvVars(config.channelMessageId) || process.env.SLACK_CHANNEL_MESSAGE_ID,
      webhookUrl: maybeReplaceEnvVars(config.webhookUrl) || process.env.SLACK_WEBHOOK_URL,
    };
  }

  @Log('debug') @IncStatistics()
  send(
    message: string | {
      text?: string;
      blocks?: {
        type: string;
        block_id?: string;
        text: {
          type: 'text' | 'mrkdwn';
          text: string;
        };
      }[];
    },
    messageId?: string,
  ): Promise<{ messageId?: string }> {
    if (!messageId) {
      messageId = this.config.channelMessageId;
    }

    if (this.config.oauthToken) {
      return request(messageId ? 'https://slack.com/api/chat.update' : 'https://slack.com/api/chat.postMessage', typeof message === 'string' ? {
        channel: this.config.channelId, ts: messageId,
        text: message,
      } : {
        channel: this.config.channelId, ts: messageId,
        ...message,
      }, 'post', this.config.oauthToken).then((res) => {
        logger.debug('SlackIntegrationService.res', res);

        return { messageId: res.ts };
      });
    }

    if (this.config.webhookUrl) {
      return request(this.config.webhookUrl, typeof message === 'string' ? {
        channel: this.config.channelId,
        text: message,
      } : {
        channel: this.config.channelId,
        ...message,
      }, 'post').then((res) => {
        logger.debug('SlackIntegrationService.res', res);

        return { messageId: null };
      });
    }
  }
}
