import { Service } from 'typedi';
import { INotificationService } from '../notifications';
import { EntityService } from '../entities.service';
import { TargetState } from '../target-state';
import { Autowired, CallbacksContainer } from '../utils';
import { ProjectsService } from '../projects.service';
import { SlackIntegrationService } from '../integrations/slack';
import { Status } from '../enums/status';
import * as _ from 'lodash';
import { AUTH_HOST, EVENT_TARGET_STATE_REREAD_FINISHED, EVENT_TARGET_STATE_UPDATE, EVENT_TARGET_STATE_UPDATE_FINISHED, EVENT_TARGET_STATE_UPDATE_STARTED, getHostWithSchema } from '../const';
import { ReleaseState } from '../release-state';
import {markDirty} from '../actions/utils';

export interface ISlackNotificationConfig {
  integration?: string;
  locale?: string;
  tz?: string;
}

@Service()
export class SlackNotificationExtensionService extends EntityService implements INotificationService {
  static readonly type: string = 'slack:notification';

  @Autowired() protected projectsService: ProjectsService;

  constructor(protected config: ISlackNotificationConfig) {
    super();
  }

  async exec() {}

  registerCallbacks(callbacks: CallbacksContainer): void {
    if (this.events[EVENT_TARGET_STATE_UPDATE] !== false) {
      callbacks.register(EVENT_TARGET_STATE_UPDATE_STARTED, async (ctx, { target, targetState }) => {
        if (!(targetState instanceof TargetState)) {
          return;
        }
console.log({targetState,id: this.id});
        if (targetState.hasTargetExtension('notification', this.id)) {
          await this.publishRelease(targetState);
        }
      });
    }
  }

  // extra methods

  async publishRelease(targetState: TargetState): Promise<void> {
    const targetStateRelease = targetState.getExtension<ReleaseState>('release', 'release', true);

    if (!targetStateRelease) {
      return;
    }

    const project = this.projectsService.get(targetState.target.ref?.projectId);
    const payload: { blocks: any[] } = {
      blocks: [ {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `⭐ Release ${targetState.version || ''}`.trim(),
        }
      } ],
    };

    const notesSections = targetStateRelease.sections.filter((section) => section.type === 'note');

    if (notesSections.length) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: notesSections.map((section) => section.description ?? '').map((note) => `${note}\n`).join('\n') || ' ',
        }
      });
    }

    if (targetStateRelease.date) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: new Md().i(`Scheduled for ${new Date(targetStateRelease.date).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}`).valueOf(),
        },
      });
    }

    if (targetStateRelease.status && targetStateRelease.status === Status.COMPLETED) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: new Md().i(`Completed at ${new Date(targetStateRelease.statusUpdateAt).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}`).valueOf(),
        },
      });
    }

    if (targetStateRelease.status && targetStateRelease.status === Status.CANCELED) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: new Md().i(`Canceled at ${new Date(targetStateRelease.statusUpdateAt).toLocaleString(this.config?.locale ?? 'en-US', { timeZone: this.config?.tz ?? 'UTC' })}`).valueOf(),
        },
      });
    }

    const streamsSections = targetStateRelease.sections.filter((section) => section.type === 'stream');

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
          const streamFlows = targetStateRelease.sections
            .filter((s) => s.type === 'op' && s.metadata?.streamId === stream?.id)
            .map((s) => s.flows.map((flow) => [ flow, s.id ])).flat()
            .filter(([ flowId, ]) => project.getFlowByFlow(flowId))
            .map(([ flowId, opId ]) => `<${getHostWithSchema(AUTH_HOST || 'sourceflow')}/projects/${project.id}/target/${stream.ref?.targetId}/release/op/${opId}/flow/${flowId}/run|${project.getFlowByFlow(flowId)?.title}>`).join(' ');

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

    const opsSections = targetStateRelease.sections.filter((section) => section.type === 'op' && section.description);

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
            text: opsSections.map((section) => new Md().b(section.description).i(_.capitalize(section.status ?? 'pending')).valueOf()).join('\n') || ' ',
          },
        },
      );
    }

    console.log(JSON.stringify(payload,undefined,2));

    // const metadata = await this.getIntegrationService(targetState).send(payload, targetState.metadata.releaseExternalMessageId);

    // if (metadata?.messageId) {
    //   targetState.metadata.releaseExternalMessageId = metadata.messageId;
    // }
  }

  private getIntegrationService(targetState: TargetState) {
    return this.projectsService
      .get(targetState.target.ref.projectId)
      .getEnvIntegraionByIntegration<SlackIntegrationService>(this.config.integration, 'slack');
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

// function getTzOffsetMin(timeZone = 'UTC') {
//   return (
//     new Date(new Date().toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
//     -
//     new Date(new Date().toLocaleString('en-US', { timeZone })).getTime()
//   ) / 6e4;
// }
