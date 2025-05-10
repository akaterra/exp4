import { Service } from 'typedi';
import { INotificationService } from '.';
import { EntityService } from '../entities.service';
import { TargetState } from '../target-state';
import { Autowired } from '../utils';
import { ProjectsService } from '../projects.service';
import { SlackIntegrationService } from '../integrations/slack';
import { Status } from '../enums/status';
import * as _ from 'lodash';
import { AUTH_DOMAIN } from '../const';

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
          text: new Md().i(`Scheduled for ${new Date(targetState.release.date).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}`).valueOf(),
        },
      });
    }

    if (targetState.release.status && targetState.release.status === Status.COMPLETED) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: new Md().i(`Completed at ${new Date(targetState.release.statusUpdateAt).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}`).valueOf(),
        },
      });
    }

    if (targetState.release.status && targetState.release.status === Status.CANCELED) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: new Md().i(`Canceled at ${new Date(targetState.release.statusUpdateAt).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}`).valueOf(),
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
          const streamFlows = targetState.release.sections
            .filter((s) => s.type === 'op' && s.metadata?.streamId === stream.id)
            .map((s) => s.flows)
            .flat()
            .map((flowId) => `<${AUTH_DOMAIN || 'http://sourceflow'}/projects/${project.id}/target/${stream.ref?.targetId}/stream/${stream.id}/flow/${flowId}/run|${project.getFlowByFlow(flowId)?.title}>`).join(' ');

          return {
            type: 'section',
            fields: [ {
              type: 'mrkdwn',
              text: new Md().b(stream?.title ?? section.id).i(streamFlows).i(section.description, true).valueOf(),
            }, {
              type: 'mrkdwn',
              text: section.changelog.map((changelog) => changelog.artifacts?.map((artifact) => new Md().t(artifact.id).b(getDescriptionValue(artifact.description)).valueOf())).flat().join('\n\n') || ' ',
            } ]
          };
        }).flat(),
      );
    }

    const opsSections = targetState.release.sections.filter((section) => section.type === 'op' && section.description);

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
            text: opsSections.map((section, i) => new Md().b(section.description).i(_.capitalize(section.status ?? 'pending')).valueOf()).join('\n') || ' ',
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

class Md {
  lines = [];

  b(line: string, withParagraph = false) {
    if (line) {
      this.lines.push(`${this.lines.length && withParagraph ? '\n' : ''}*${line}*`);
    }

    return this;
  }

  i(line: string, withParagraph = false) {
    if (line) {
      this.lines.push(`${this.lines.length && withParagraph ? '\n' : ''}_${line}_`);
    }

    return this;
  }

  t(line: string, withParagraph = false) {
    if (line) {
      this.lines.push(`${this.lines.length && withParagraph ? '\n' : ''}${line}`);
    }

    return this;
  }

  toString() {
    return this.lines.join('\n');
  }

  valueOf() {
    return this.lines.join('\n');
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
