import { IExtensionService } from '.';
import {markDirty} from '../actions/utils';
import { EVENT_STREAM_STATE_REREAD, EVENT_STREAM_STATE_REREAD_FINISHED, EVENT_TARGET_STATE_REREAD, EVENT_TARGET_STATE_REREAD_FINISHED, EVENT_TARGET_STATE_REREAD_STARTED, EVENT_TARGET_STATE_UPDATE, EVENT_TARGET_STATE_UPDATE_FINISHED } from '../const';
import { EntityService } from '../entities.service';
import {Status} from '../enums/status';
import { IProjectArtifact, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { ProjectsService } from '../projects.service';
import { IReleaseStateSection, ReleaseState } from '../release-state';
import {StreamState} from '../stream-state';
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
    if (this.events[EVENT_STREAM_STATE_REREAD] !== false) {
      callbacks.register(EVENT_STREAM_STATE_REREAD_FINISHED, async ({ stream, streamState }: { stream: IProjectTargetStreamDef; streamState: StreamState }) => {
        if (!(streamState instanceof StreamState)) {
          return;
        }

        const targetState = this.projectsService.get(stream.ref?.projectId).state.getTargetState(stream.ref?.targetId);

        if (targetState.hasExtension('release')) {
          const targetStateRelease = targetState.getExtension<ReleaseState>('release', 'release');

          if (targetStateRelease.status !== Status.COMPLETED) {
            targetStateRelease.setSectionByStreamId(
              stream.id,
              streamState.history.artifact,
              streamState.history.change,
              null,
              true,
              true,
            );
          }
        }
      });
    }

    if (this.events[EVENT_TARGET_STATE_REREAD] !== false) {
      callbacks.register(EVENT_TARGET_STATE_REREAD_FINISHED, async ({ target, targetState }: { target: IProjectTargetDef; targetState: TargetState }) => {
        if (!(targetState instanceof TargetState)) {
          return;
        }
 
        if (targetState.hasTargetExtension('release', this.id)) {
          await this.ensureReleaseExtension(targetState);
        }
      });
    }

    if (this.events[EVENT_TARGET_STATE_UPDATE] !== false) {
      callbacks.register(EVENT_TARGET_STATE_UPDATE_FINISHED, async ({ target, targetState }) => {
        if (!(targetState instanceof TargetState)) {
          return;
        }

        if (targetState.hasExtension('release')) {
          // this.projectsService.
          // await versioning.setTargetVar(target, 'ext_release', targetStateRelease.toJSON(), true);
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

    const targetStateRelease =
      targetState.getExtension<ReleaseState>(this.id, this.type, true) ??
      new ReleaseState({ id: this.id, type: this.type, config: this.config });

    targetState.setExtension('release', targetStateRelease);

    return targetStateRelease.setSectionByStreamId(streamId, artifacts, changes, notes, isSystem, onlyExisting);
  }

  protected async ensureReleaseExtension(targetState: TargetState): Promise<ReleaseState> {
    const project = this.projectsService.get(targetState.target.ref?.projectId);
    const versioning = project.getEnvVersioningByTarget(targetState.target);
    const targetStateRelease = targetState.getExtension<ReleaseState>('release', 'release', true);
    const release = await versioning.getTargetVar(targetState.target, 'ext_release', null, true);

    if (!targetStateRelease || (release && targetStateRelease.ver < release.ver)) {
      const targetStateRelease = new ReleaseState({
        ...release,
        id: this.id,
        type: this.type,
        config: this.config,
      });

      targetState.setExtension('release', targetStateRelease);

      return targetStateRelease;
    }

    return targetStateRelease;
  }
}
