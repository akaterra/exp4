import { IService } from './entities.service';
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
  HistoryArtifactMetadata extends Record<string, unknown> = Metadata,
  HistoryChangeMetadata extends Record<string, unknown> = Metadata,
> implements IService {
  id: string;
  type: string;

  readonly assertType = 'stream';

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
      metadata?: HistoryArtifactMetadata;
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
  link?: string;
  metadata?: Metadata;
  version?: string;

  isDirty: boolean = false;
  ver: number = 0;

  isSyncing?: boolean;

  get state() {
    return {
      metadata: this.metadata,
      ver: this.ver,
    };
  }

  constructor(props: Partial<StreamState>) {
    this.id = props.id ?? null;
    this.type = props.type ?? null;
    this.stream = props.stream ?? null;
    this.history = (props.history ?? {}) as StreamState<Metadata, HistoryActionMetadata, HistoryArtifactMetadata, HistoryChangeMetadata>['history'];
    this.metadata = (props.metadata ?? {}) as Metadata;
    this.link = props.link ?? null;
    this.isDirty = props.isDirty ?? false;
    this.version = props.version ?? null;
    this.ver = props.ver ?? 0;
  }

  incVer() {
    this.ver ++;

    return this;
  }

  pushArtifact(artifact: StreamState<Metadata, HistoryActionMetadata, HistoryArtifactMetadata, HistoryChangeMetadata>['history']['artifact'][0]) {
    if (!this.history) {
      this.history = {};
    }

    if (!this.history.artifact) {
      this.history.artifact = [];
    }

    this.history.artifact.push(artifact);

    return this;
  }

  pushArtifactUniq(artifact: StreamState<Metadata, HistoryActionMetadata, HistoryArtifactMetadata, HistoryChangeMetadata>['history']['artifact'][0]) {
    const old = this.history?.artifact?.find((e) => e.id === artifact.id && e.type === artifact.type);

    if (old) {
      for (const [ key, val ] of Object.entries(artifact)) {
        if (key === 'metadata') {
          if (!old.metadata) {
            old.metadata = {} as HistoryArtifactMetadata;
          }

          for (const [ metadataKey, metadataVal ] of Object.entries(artifact.metadata)) {
            if (metadataVal != null) {
              (old.metadata as Record<string, unknown>)[metadataKey] = metadataVal;
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
      id: this.id,
      type: this.type,

      history: this.history,
      link: this.link,
      metadata: this.metadata,
      version: this.version,

      ver: this.ver,
    }
  }
}
