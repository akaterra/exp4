import { IExtensionService } from '.';
import { EVENT_TARGET_STATE_REREAD_STARTED, EVENT_TARGET_STATE_UPDATE_FINISHED } from '../const';
import { EntityService } from '../entities.service';
import { IProjectArtifact, IProjectFlowDef, IProjectTargetStreamDef } from '../project';
import { ProjectsService } from '../projects.service';
import { IReleaseStateSection, ReleaseState } from '../release-state';
import { TargetState } from '../target-state';
import { Autowired, CallbacksContainer } from '../utils';

export interface IReleaseConfig {
  sections: {
    id?: string;
    type?: string;

    changelog?: {
      artifacts?: IProjectArtifact['id'][];
      changes?: IProjectArtifact['id'][];
      isSystem?: boolean;
    };
    flows?: IProjectFlowDef['id'][];
  }[];
}

export class ReleaseExtensionService extends EntityService implements IExtensionService {
  static readonly type: string = 'release';

  @Autowired() protected projectsService: ProjectsService;

  constructor(public readonly config?: IReleaseConfig) {
    super();
  }

  async exec() {}

  registerCallbacks(callbacks: CallbacksContainer): void {
    if (this.events['targetState:reread'] !== false) {
      callbacks.register(EVENT_TARGET_STATE_REREAD_STARTED, async ({ target, targetState }) => {
        if (!targetState?.target?.extensions?.release) {
          return;
        }

        if (!(targetState instanceof TargetState)) {
          return;
        }

        if (targetState.hasTargetExtension('release', this.id)) {
          const project = this.projectsService.get(target.ref?.projectId);
          const versioning = project.getEnvVersioningByTarget(target);
          const targetStateRelease = targetState.getExtension<ReleaseState>('release', 'release', true);
          const release = await versioning.getTargetVar(target, 'release', null, true);

          if (!targetStateRelease || (release && targetStateRelease.ver < release.ver)) {
            targetState.setExtension(
              'release',
              new ReleaseState({ ...release, id: this.id, type: this.type, config: this.config }),
            );
          }
        }
      });
    }

    if (this.events['targetState:update'] !== false) {
      callbacks.register(EVENT_TARGET_STATE_UPDATE_FINISHED, async ({ target, targetState }) => {
        if (!targetState?.target?.extensions?.release) {
          return;
        }

        if (!(targetState instanceof TargetState)) {
          return;
        }

        if (targetState.hasTargetExtension('release', this.id)) {
          const project = this.projectsService.get(target.ref?.projectId);
          const versioning = project.getEnvVersioningByTarget(target);
          const targetStateRelease = targetState.getExtension<ReleaseState>('release', 'release', true);
          const release = await versioning.getTargetVar(target, 'release', null, true);

          if (targetStateRelease && (!release || targetStateRelease.ver >= release.ver)) {
            // await versioning.setTargetVar(target, 'release', targetStateRelease.toJSON(), true);
          }
        }
      });
    }
  }

  setTargetStateExtensionReleaseSection(
    targetState: TargetState,
    streamId: IProjectTargetStreamDef['id'],
    artifacts?: IReleaseStateSection['changelog'][0]['artifacts'],
    changes? : IReleaseStateSection['changelog'][0]['changes'],
    notes?: IReleaseStateSection['changelog'][0]['notes'],
    isSystem?: boolean,
    onlyExisting?: boolean,
  ) {
    if (!targetState?.hasTargetExtension('release')) {
      return;
    }

    const releaseState = targetState.getExtension<ReleaseState>(this.id, this.type, true)
      ?? new ReleaseState({ id: this.id, type: this.type, config: this.config });

    targetState.setExtension('release', releaseState);

    return releaseState.setSectionByStreamId(streamId, artifacts, changes, notes, isSystem, onlyExisting);
  }
}
