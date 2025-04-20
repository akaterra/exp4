import { IProjectTargetStreamDef } from './project';
import { ReleaseState } from './release';
import { StreamState } from './stream';

export class TargetState {
  id: string;
  type: string;

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
}
