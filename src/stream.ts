import { Status } from './enums/status';
import { IProjectTargetStream } from './project';

export interface IStreamHistoryStep {
  id: string;
  type: string;

  description: string;
  link: string;
  status: Status;
}

export interface IStream<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
  HistoryActionMetadata extends Record<string, unknown> = Metadata,
  HistoryChangeMetadata extends Record<string, unknown> = Metadata,
> {
  projectTargetStream?: IProjectTargetStream;

  id: string;
  type: string;

  projectId: string;
  targetId: string;

  history: {
    action?: {
      id: string;
      type: string;
  
      author?: { name?: string; link?: string };
      description?: string;
      link?: string;
      metadata?: HistoryActionMetadata;
      steps?: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status?: Status;
      time?: Date;
    }[];
    change?: {
      id: string;
      type: string;
  
      author?: { name?: string; link?: string };
      description?: string;
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
}
