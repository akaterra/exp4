import { Service } from 'typedi';
import { INotificationService } from '.';
import { EntityService } from '../entities.service';
import { TargetState } from '../target-state';
import {Autowired, request} from '../utils';
import {ProjectsService} from '../projects.service';
import {SlackIntegrationService} from '../integrations/slack';

@Service()
export class SlackNotificationService extends EntityService implements INotificationService {
  static readonly type: string = 'slack';

  @Autowired() protected projectsService: ProjectsService;

  constructor(protected config?: { integration?: string }) {
    super();
  }

  async publishRelease(targetState: TargetState): Promise<void> {
    const project = this.projectsService.get(targetState.target.ref?.projectId);
    const payload = {
      text: `### Release ${targetState.version}`,
      blocks: [],
    }

    const blockArtifacts = {
      text: [],
    };
    const blockComponents = {
      text: [],
    };
    const blockDefault = {
      text: [],
    };

    for (const section of targetState.release.sections) {
      switch (section.type) {
        case 'stream': {
          for (const changelog of section.changelog) {
            const stream = project.getTargetStreamByTargetAndStream(targetState.id, changelog.streamId);

            if (changelog.notes?.length) {
              if (!blockComponents.text.length) {
                blockArtifacts.text.push('##### Components');
              }

              blockComponents.text.push(`**${stream.title}**`);

              changelog.notes.forEach((note) => {
                blockComponents.text.push(`* ` + note.text);
              });
            }

            if (changelog.artifacts?.length) {
              if (!blockArtifacts.text.length) {
                blockArtifacts.text.push('##### Artifacts');
                blockArtifacts.text.push('| Component | Artifact ID | Artifact value |');
                blockArtifacts.text.push('| --- | --- | --: |');
              }

              changelog.artifacts.forEach((artifact, i) => {
                if (i === 0) {
                  blockArtifacts.text.push(`| ${stream.title} | ${artifact.id} | ${artifact.description} |`);
                } else {
                  blockArtifacts.text.push(`| | ${artifact.id} | ${artifact.description} |`);
                }
              });
            }
          }

          break;
        }
        default:
          if (section.description) {
            blockDefault.text.push(section.description);
          }
      }
    }

    if (blockDefault.text.length) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: blockDefault.text.join('\n'),
        }
      });
    }

    if (blockComponents.text.length) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: blockComponents.text.join('\n'),
        }
      });
    }

    if (blockArtifacts.text.length) {
      payload.blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: blockArtifacts.text.join('\n'),
        }
      });
    }

    console.log(payload);

    // await this.getIntegrationService(targetState).send(payload);
  }

  private getIntegrationService(targetState: TargetState) {
    return this.projectsService
      .get(targetState.target.ref.projectId)
      .getEnvIntegraionByIntegration<SlackIntegrationService>(targetState.target.notification, this.type);
  }
}
