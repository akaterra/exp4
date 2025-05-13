// import {Status} from './enums/status';
import { IService } from './entities.service';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
// import { IReleaseStateSection, ReleaseState } from './release-state';
import { StreamState } from './stream-state';

export class TargetState implements IService {
  id: IProjectTargetDef['id'];
  type: IProjectTargetDef['type'];

  assertType = 'target';

  target: IProjectTargetDef;

  extensions: Record<string, IService> = {};
  streams: Record<IProjectTargetStreamDef['id'], StreamState> = {};
  version?: string;

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

  hasTargetExtension(id: IProjectDef['id'], compareToId?: IProjectDef['id']): boolean {
    const extensionId = typeof this.target.extensions?.[id] === 'string'
      ? this.target.extensions?.[id]
      : this.target.extensions?.[id]?.id;

    return compareToId ? extensionId === compareToId : !!extensionId;
  }

  get isSyncing(): boolean {
    return Object.values(this.streams).some((stream) => stream.isSyncing);
  }

  constructor(props: Partial<TargetState>) {
    Reflect.setPrototypeOf(props, TargetState.prototype);

    props.streams = props.streams ?? {};

    return props as TargetState;
  }

  // setReleaseSectionByStreamId(
  //   streamId: IProjectTargetStreamDef['id'],
  //   artifacts?: IReleaseStateSection['changelog'][0]['artifacts'],
  //   changes? : IReleaseStateSection['changelog'][0]['changes'],
  //   notes?: IReleaseStateSection['changelog'][0]['notes'],
  //   isSystem?: boolean,
  //   onlyExisting?: boolean,
  // ) {
  //   if (!this.target.release) {
  //     return;
  //   }

  //   if (!this.release) {
  //     this.release = new ReleaseState({ id: this.id, type: this.type });
  //   }

  //   return this.release.setSectionByStreamId(streamId, artifacts, changes, notes, isSystem, onlyExisting);
  // }

  toJSON() {
    return {
      ...this,
      projectsService: undefined,
      target: undefined,
    };
  }
}
