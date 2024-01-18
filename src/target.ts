import {IProjectTargetStreamDef} from './project';
import {StreamState} from './stream';

export class TargetState {
  id: string;
  type: string;

  isSyncing?: boolean;
  streams?: Record<IProjectTargetStreamDef['id'], StreamState>;
  version?: string;

  constructor(props: Partial<TargetState>) {
    Reflect.setPrototypeOf(props, TargetState.prototype);

    props.isSyncing = props.isSyncing ?? false;
    props.streams = props.streams ?? {};

    return props as TargetState;
  }
}
