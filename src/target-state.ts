import { IService } from './entities.service';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { StreamState } from './stream-state';

export class TargetState<
  Metadata extends Record<string, unknown> = Record<string, unknown>
> implements IService {
  id: IProjectTargetDef['id'];
  type: IProjectTargetDef['type'];

  readonly assertType = 'target';

  target: IProjectTargetDef;

  extensions: Record<string, IService> = {};
  metadata: Metadata;
  streams: Record<IProjectTargetStreamDef['id'], StreamState> = {};
  version?: string;

  isDirty: boolean = false;
  ver: number = 0;

  get isSyncing(): boolean {
    return Object.values(this.streams).some((stream) => stream.isSyncing);
  }

  get state() {
    return {
      extensions: this.extensions,
      metadata: this.metadata,
      ver: this.ver,
    };
  }

  constructor(props: Partial<TargetState>) {
    this.id = props.id ?? null;
    this.type = props.type ?? null;
    this.extensions = {}; // props.extensions ?? {};
    this.metadata = (props.metadata ?? {}) as Metadata;
    this.streams = props.streams ?? {};
    this.target = props.target ?? null;
    this.version = props.version ?? null;
    this.isDirty = props.isDirty ?? false;
    this.ver = props.ver ?? 0;
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

  incVer() {
    this.ver ++;

    return this;
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,

      extensions: this.extensions,
      metadata: this.metadata,
      streams: this.streams,
      version: this.version,

      ver: this.ver,
    }
  }
}
