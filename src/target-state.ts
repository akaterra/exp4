import { IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { ReleaseState } from './release';
import { StreamState } from './stream-state';

export class TargetState {
  id: string;
  type: string;

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

  toJSON() {
    return {
      ...this,
      projectsService: undefined,
      target: undefined,
    };
  }
}
