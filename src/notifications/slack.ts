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
          text: `Release ${targetState.version}`,
        }
      } ],
    };

    const blockArtifacts = {
      components: [], artifactsIds: [], artifacts: [],
    };
    const blockComponents = {
      components: [],
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
              blockComponents.components.push([ stream.title, changelog.notes.map((v) => v.text) ]);
            }

            if (changelog.artifacts?.length) {
              changelog.artifacts.forEach((artifact, i) => {
                if (i === 0) {
                  blockArtifacts.components.push(stream.title);
                  blockArtifacts.artifactsIds.push(artifact.id);
                  blockArtifacts.artifacts.push(artifact.description);
                } else {
                  blockArtifacts.components.push('');
                  blockArtifacts.artifactsIds.push(artifact.id);
                  blockArtifacts.artifacts.push(artifact.description);
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

    if (blockComponents.components.length) {
      payload.blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'Components' },
      }, {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: blockComponents.components.map((component) => [ `*${component[0]}*`, ...component[1].map((v) => `- ${v}`) ]).flat().join('\n'),
        }
      });
    }

    if (blockArtifacts.components.length) {
      payload.blocks.push({
        type: 'header',
        text: { type: 'plain_text', text: 'Artifacts' },
      }, {
        type: 'section',
        fields: [ {
          type: 'mrkdwn',
          text: '*Component*\n' + blockArtifacts.components.join('\n'),
        }, {
          type: 'mrkdwn',
          text: '*Artifact ID*\n' + blockArtifacts.artifactsIds.join('\n'),
        }, {
          type: 'mrkdwn',
          text: '*Artifact*\n' + blockArtifacts.artifacts.join('\n'),
        } ],
      });
    }

    console.log(JSON.stringify(payload,undefined,2));

    await this.getIntegrationService(targetState).send(payload);
  }

  private getIntegrationService(targetState: TargetState) {
    return this.projectsService
      .get(targetState.target.ref.projectId)
      .getEnvIntegraionByIntegration<SlackIntegrationService>(this.config?.integration, this.type);
  }
}
