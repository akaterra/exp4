import { IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { IReleaseStateSection, ReleaseState } from './release-state';
import { StreamState } from './stream-state';

export class TargetState {
  id: IProjectTargetDef['id'];
  type: IProjectTargetDef['type'];

  target: IProjectTargetDef;

  release?: ReleaseState;
  streams?: Record<IProjectTargetStreamDef['id'], StreamState>;
  version?: string;

  get isSyncing(): boolean {
    return Object.values(this.streams).some((stream) => stream.isSyncing);
  }

  constructor(props: Partial<TargetState>) {
    Reflect.setPrototypeOf(props, TargetState.prototype);

    props.streams = props.streams ?? {};

    return props as TargetState;
  }

  setReleaseSectionByStreamId(
    streamId: IProjectTargetStreamDef['id'],
    artifacts?: IReleaseStateSection['changelog'][0]['artifacts'],
    changes? : IReleaseStateSection['changelog'][0]['changes'],
    notes?: IReleaseStateSection['changelog'][0]['notes'],
    isSystem?: boolean,
    onlyExisting?: boolean,
  ) {
    if (!this.target.release) {
      return;
    }

    if (!this.release) {
      this.release = new ReleaseState({ id: this.id, type: this.type });
    }

    return this.release.setSectionByStreamId(streamId, artifacts, changes, notes, isSystem, onlyExisting);
  }

  toJSON() {
    return {
      ...this,
      projectsService: undefined,
      target: undefined,
    };
  }
}
