import { IProjectTargetStream } from './project';

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
      status?: string;
      time?: Date;
    }[];
    change?: {
      id: string;
      type: string;
  
      author?: { name?: string; link?: string };
      description?: string;
      link?: string;
      metadata?: HistoryChangeMetadata;
      status?: string;
      time?: Date;
    }[];
  };
  link?: string;
  metadata?: Metadata;
  version?: string;
}
