import { Status } from './enums/status';
import { IProjectTargetStreamDef } from './project';

export interface IStreamStateContext extends Record<string, unknown> {
  artifact?: Record<string, unknown>;
  global?: Record<string, unknown>;
}

export interface IStreamHistoryStep {
  id: string;
  type: string;

  description: string;
  link: string;
  runningTimeSeconds?: number;
  status: Status;
}

export class StreamState<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
  HistoryActionMetadata extends Record<string, unknown> = Metadata,
  HistoryChangeMetadata extends Record<string, unknown> = Metadata,
> {
  id: string;
  type: string;

  stream: IProjectTargetStreamDef;

  history: {
    action?: {
      id: string;
      type: string;
  
      author?: { name?: string; link?: string };
      description?: string | { level: string; value: string };
      link?: string;
      metadata?: HistoryActionMetadata;
      steps?: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status?: Status;
      time?: Date;
    }[];
    artifact?: {
      id: string;
      type: string;
  
      author?: { name?: string; link?: string };
      description?: string | { level: string; value: string };
      link?: string;
      metadata?: Record<string, any>;
      steps?: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status?: Status;
      time?: Date;
    }[];
    change?: {
      id: string;
      type: string;
  
      author?: { name?: string; link?: string };
      description?: string | { level: string; value: string };
      link?: string;
      metadata?: HistoryChangeMetadata;
      steps?: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status?: Status;
      time?: Date;
    }[];
  };
  isSyncing?: boolean;
  link?: string;
  metadata?: Metadata;
  version?: string;

  ver: number = 0;

  constructor(props: Partial<StreamState>) {
    Reflect.setPrototypeOf(props, StreamState.prototype);

    props.isSyncing = props.isSyncing ?? false;
    props.ver = props.ver ?? 0;

    return props as StreamState<Metadata, HistoryActionMetadata, HistoryChangeMetadata>;
  }

  incVer() {
    this.ver ++;

    return this;
  }

  pushArtifact(artifact: StreamState['history']['artifact'][0]) {
    if (!this.history) {
      this.history = {};
    }

    if (!this.history.artifact) {
      this.history.artifact = [];
    }

    this.history.artifact.push(artifact);

    return this;
  }

  pushArtifactUniq(artifact: StreamState['history']['artifact'][0]) {
    const old = this.history?.artifact?.find((e) => e.id === artifact.id && e.type === artifact.type);

    if (old) {
      for (const [ key, val ] of Object.entries(artifact)) {
        if (key === 'metadata') {
          if (!old.metadata) {
            old.metadata = {};
          }

          for (const [ metadataKey, metadataVal ] of Object.entries(artifact.metadata)) {
            if (metadataVal != null) {
              old.metadata[metadataKey] = metadataVal;
            }
          }
        } else {
          if (val != null) {
            old[key] = val;
          }
        }
      }
    } else {
      this.pushArtifact(artifact);
    }

    return this;
  }

  toJSON() {
    return {
      ...this,
      stream: undefined,
    };
  }
}
