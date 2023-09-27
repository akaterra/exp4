import { IProjectTarget } from './project';

export class TargetState {
  id: string;
  type: string;

  version?: string;

  constructor(props) {
    Reflect.setPrototypeOf(props, TargetState.prototype);

    return props as unknown as TargetState;
  }
}
