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

    const blockArtifacts: { stream; artifacts: { id, value }[]; notes }[] = [];
    const blockDefault: { notes }[] = [];

    for (const section of targetState.release.sections) {
      switch (section.type) {
        case 'stream': {
          for (const changelog of section.changelog) {
            const stream = project.getTargetStreamByTargetAndStream(targetState.id, changelog.streamId);

            blockArtifacts.push({
              stream: stream.title,
              artifacts: changelog.artifacts.map((artifact) => ({
                id: artifact.id,
                value: artifact.description,
              })),
              notes: changelog.notes,
            });
          }

          break;
        }
        default:
          if (section.description) {
            blockDefault.push({ notes: [ section.description ] });
          }
      }
    }

    if (blockDefault.length) {
      payload.blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'Notes' },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: blockDefault.map((section) => section.notes.map((note) => note.text)).flat().map((note, i) => `${i.toString().padEnd(2, ' ')}. ${note}`).join('\n'),
        }
      });
    }

    if (blockArtifacts.length) {
      payload.blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'Components' },
      }, ...blockArtifacts.map((blockArtifact) => ({
        type: 'section',
        fields: [ {
          type: 'mrkdwn',
          text: `*${blockArtifact.stream}*\n\n${blockArtifact.notes.map((note, i) => `${i.toString().padEnd(2, ' ')}. ${note.text}`).join('\n')}`,
        }, {
          type: 'mrkdwn',
          text: blockArtifact.artifacts.map((artifact) => `> ${artifact.id}\n> _${artifact.value}_\n`).join('\n'),
        } ],
      })));
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
