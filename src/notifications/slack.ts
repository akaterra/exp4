import { Service } from 'typedi';
import { INotificationService } from '.';
import { EntityService } from '../entities.service';
import { TargetState } from '../target-state';
import { Autowired } from '../utils';
import { ProjectsService } from '../projects.service';
import { SlackIntegrationService } from '../integrations/slack';
import { Status } from '../enums/status';
import * as _ from 'lodash';

@Service()
export class SlackNotificationService extends EntityService implements INotificationService {
  static readonly type: string = 'slack';

  @Autowired() protected projectsService: ProjectsService;

  constructor(protected config?: { integration?: string; locale?: string; tz?: string }) {
    super();
  }

  async publishRelease(targetState: TargetState): Promise<void> {
    const project = this.projectsService.get(targetState.target.ref?.projectId);
    const payload: { blocks: any[] } = {
      blocks: [ {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⭐ Release ${targetState.version}`,
        }
      } ],
    };

    const notesSections = targetState.release.sections.filter((section) => section.type === 'note');

    if (notesSections.length) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: notesSections.map((section) => section.description ?? '').map((note) => `${note}\n`).join('\n') || ' ',
        }
      });
    }

    if (targetState.release.date) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_Scheduled for ${new Date(targetState.release.date).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}_`,
        },
      });
    }

    if (targetState.release.status && targetState.release.status === Status.COMPLETED) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_Completed at ${new Date(targetState.release.statusUpdateAt).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}_`,
        },
      });
    }

    if (targetState.release.status && targetState.release.status === Status.CANCELED) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `_Canceled at ${new Date(targetState.release.statusUpdateAt).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}_`,
        },
      });
    }

    const streamsSections = targetState.release.sections.filter((section) => section.type === 'stream');

    if (streamsSections.length) {
      payload.blocks.push(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Components',
          },
        },
        ...streamsSections.map((section) => {
          const stream = project.getTargetStreamByTargetAndStream(targetState.id, section.id, true);

          return {
            type: 'section',
            fields: [ {
              type: 'mrkdwn',
              text: `*${stream?.title ?? section.id}*\n_${section.description ?? ''}_`,
            }, {
              type: 'mrkdwn',
              text: section.changelog.map((changelog) => changelog.artifacts?.map((artifact) => `${artifact.id}\n*${getDescriptionValue(artifact.description) ?? ''}*\n`)).flat().join('\n') || ' ',
            } ]
          };
        }).flat(),
      );
    }

    const opsSections = targetState.release.sections.filter((section) => section.type === 'op');

    if (opsSections.length) {
      payload.blocks.push(
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'To do',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: opsSections.map((section, i) => `*${section.description ?? ''}*\n_${_.capitalize(section.status ?? 'pending')}_\n`).join('\n') || ' ',
          },
        },
      );
    }

    console.log(JSON.stringify(payload,undefined,2));

    const metadata = await this.getIntegrationService(targetState).send(payload, targetState.release.metadata.messageId);

    if (metadata?.messageId) {
      targetState.release.metadata.messageId = metadata.messageId;
    }
  }

  private getIntegrationService(targetState: TargetState) {
    return this.projectsService
      .get(targetState.target.ref.projectId)
      .getEnvIntegraionByIntegration<SlackIntegrationService>(this.config?.integration, this.type);
  }
}

function getDescriptionValue(description) {
  return description?.value ?? description;
}

function getTzOffsetMin(timeZone = 'UTC') {
  return (
    new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
    -
    new Date(new Date().toLocaleString('en-US', { timeZone })).getTime()
  ) / 6e4;
}
