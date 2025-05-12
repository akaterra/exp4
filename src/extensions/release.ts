import { IExtensionService } from '.';
import { EntityService } from '../entities.service';
import { IProjectArtifact, IProjectDef, IProjectFlowDef, IProjectTargetStreamDef } from '../project';
import {IReleaseStateSection, ReleaseState} from '../release-state';
import {TargetState} from '../target-state';
import {CallbacksContainer} from '../utils';

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

  constructor(public readonly config?: IReleaseConfig) {
    super();
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
    if (!targetState?.target?.extensions?.release) {
      return;
    }

    if (!targetState.extensions.release) {
      targetState.extensions.release = new ReleaseState({ id: this.id, type: this.type });
    }

    return targetState.extensions.release.setSectionByStreamId(streamId, artifacts, changes, notes, isSystem, onlyExisting);
  }

  registerCallbacks(callbacks: CallbacksContainer): void {
    callbacks.register('targetState:reread', ({ target, targetState }) => {
      if (!targetState?.target?.extensions?.release) {
        return;
      }

      if (!(targetState instanceof TargetState)) {
        return;
      }

      if (!targetState.extensions.release) {
        targetState.extensions.release = new ReleaseState({ id: this.id, type: this.type });
      }
    });
  }
}
