import { Service } from 'typedi';
import { INotificationService } from '.';
import { EntityService } from '../entities.service';
import { TargetState } from '../target-state';
import {Autowired, request} from '../utils';
import {ProjectsService} from '../projects.service';
import {SlackIntegrationService} from '../integrations/slack';
import {IProjectDef} from '../project';

@Service()
export class SlackNotificationService extends EntityService implements INotificationService {
  static readonly type: string = 'slack';

  @Autowired() protected projectsService: ProjectsService;

  constructor(protected config?: { integration?: string }) {
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
        type: 'header',
        text: { type: 'plain_text', text: 'Notes' },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: notesSections.map((section) => section.description).map((note) => `${note}\n`).join('\n'),
        }
      });
    }

    const streamsSections = targetState.release.sections.filter((section) => section.type === 'stream');

    if (streamsSections.length) {
      payload.blocks.push(
        {
          type: 'header',
          text: { type: 'plain_text', text: 'Components' },
        },
        ...streamsSections.map((section) => {
          const stream = project.getTargetStreamByTargetAndStream(targetState.id, section.id);

          return {
            type: 'section',
            fields: [ {
              type: 'mrkdwn',
              text: `*${stream?.title ?? section.id}*\n\n${section.description}`,
            }, {
              type: 'mrkdwn',
              text: section.changelog.map((changelog) => changelog.artifacts?.map((artifact) => `> ${artifact.id}\n> _${artifact.description}_\n`)).flat().join('\n'),
            } ],
          };
        },
      ));
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
