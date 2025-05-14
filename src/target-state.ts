import { IService } from './entities.service';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { StreamState } from './stream-state';

export class TargetState implements IService {
  id: IProjectTargetDef['id'];
  type: IProjectTargetDef['type'];

  assertType = 'target';

  target: IProjectTargetDef;

  extensions: Record<string, IService> = {};
  metadata: Record<string, unknown> = {};
  streams: Record<IProjectTargetStreamDef['id'], StreamState> = {};
  version?: string;

  isDirty: boolean = false;
  ver: number = 0;

  get isSyncing(): boolean {
    return Object.values(this.streams).some((stream) => stream.isSyncing);
  }

  get state() {
    return {
      metadata: this.metadata,
      ver: this.ver,
    };
  }

  constructor(props: Partial<TargetState>) {
    Reflect.setPrototypeOf(props, TargetState.prototype);

    props.extensions = {};
    props.metadata = props.metadata ?? {};
    props.streams = props.streams ?? {};

    return props as TargetState;
  }

  getExtension<T extends IService>(id: IProjectDef['id'], assertType?: IProjectDef['type'], unsafe?: boolean): T {
    if (!this.extensions[id]) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Extension "${id}" not found`);
    }

    if (assertType && this.extensions[id].type !== assertType) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Extension "${id}" is not of type "${assertType}"`);
    }

    return this.extensions[id] as T;
  }

  getExtensionOfTarget<T extends IService>(id: IProjectDef['id'], assertType?: IProjectDef['type'], unsafe?: boolean): T {
    const extensionId = typeof this.target.extensions?.[id] === 'string'
      ? this.target.extensions?.[id]
      : this.target.extensions?.[id]?.id;

    return this.getExtension<T>(extensionId, assertType, unsafe);
  }

  setExtension<T extends IService>(id: IProjectDef['id'], extension: T) {
    this.extensions[id ?? extension.id] = extension;

    return this;
  }

  hasExtension(id: IProjectDef['id']): boolean {
    return !!this.extensions[id];
  }

  hasTargetExtension(id: IProjectDef['id'], compareToId?: IProjectDef['id']): boolean {
    const extensionId = typeof this.target.extensions?.[id] === 'string'
      ? this.target.extensions?.[id]
      : this.target.extensions?.[id]?.id;

    return compareToId ? extensionId === compareToId : !!extensionId;
  }

  toJSON() {
    return {
      ...this,
      projectsService: undefined,
      target: undefined,
    };
  }
}
