import { Status } from '../../enums/status';
import { IProject, IProjectTarget, IProjectTargetStream } from './project';

export interface IStreamHistoryStep {
  id: IProjectTargetStream['id'];
  type: IProjectTargetStream['type'];

  description: string;
  link: string;
  runningTimeSeconds: number;
  status: Status;
}

export interface IProjectTargetStreamState {
  id: IProjectTargetStream['id'];
  type: IProjectTargetStream['type'];

  ref: IProjectTargetStream['ref'];

  history: {
    action: {
      id: string;
      type: string;

      author: { name: string; link: string; };
      description: string;
      link: string;
      metadata: Record<string, unknown>;
      steps: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status: Status;
      time: string;
    }[];
    artifact: {
      id: string;
      type: string;

      author: { name: string; link: string; };
      description: { level: string, value: string } | string;
      link: string;
      metadata: Record<string, unknown>;
      steps: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status: Status;
      time: string;

      _search: Set<string>;
    }[];
    change: {
      id: string;
      type: string;

      author: { name: string; link: string; };
      description: string;
      link: string;
      metadata: Record<string, unknown>;
      steps: Record<IStreamHistoryStep['id'], IStreamHistoryStep>;
      status: Status;
      time: string;
    }[];
  };
  link: string;
  metadata: Record<string, unknown>;
  version: string;
  
  isSyncing: boolean;
  ver: number;

  _artifactsLabel: 'default' | 'failure' | 'success' | 'warning';
  _label: 'default' | 'failure' | 'success' | 'warning';
  _lastActionLabel: 'default' | 'failure' | 'success' | 'warning';
  _lastChangeLabel: 'default' | 'failure' | 'success' | 'warning';
  _search: Set<string>;
}

export type IReleaseStateSection = {
  id: IProjectTarget['id'];
  type: IProjectTarget['type'];

  description?: string;

  assingeeUserId?: string;
  changelog?: {
    id?: IProjectTarget['id'];
    notes?: { id: string; text: string }[];

    artifacts?: Pick<
      IProjectTargetStreamState['history']['artifact'][number],
      'id' | 'type' | 'description' | 'link' | 'status' | 'time'
    >[];
    changes?: Pick<
      IProjectTargetStreamState['history']['change'][number],
      'id' | 'type' | 'description' | 'link' | 'status' | 'time'
    >[];
  }[];
  flows?: IProject['id'][];
  level?: number;
  status?: string;
}

export type IProjectTargetState = {
  id: IProjectTarget['id'];
  type: IProjectTarget['type'];

  ref: IProjectTarget['ref'];

  release: { date: Date; sections: IReleaseStateSection[] };
  streams: Record<string, IProjectTargetStreamState>;
  version: string;

  isSyncing: boolean;
  ver: number;
};

export type IProjectState = {
  id: IProject['id'];
  targets: Record<string, IProjectTargetState>;
};
