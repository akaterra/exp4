import { Status } from '../../enums/status';
import { IProject, IProjectTarget, IProjectTargetStream } from './project';

export interface IStreamHistoryStep {
  id: string;
  type: string;

  description: string;
  link: string;
  runningTimeSeconds: number;
  status: Status;
}

export interface IProjectTargetStreamState {
  id: IProjectTargetStream['id'];
  type: IProjectTargetStream['id'];

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

  ver: number;

  _label: 'default' | 'failure' | 'success' | 'warning';
  _search: Set<string>;
}

export type IProjectTargetState = {
  id: IProjectTarget['id'];
  streams: Record<string, IProjectTargetStreamState>;
  version: string;
};

export type IProjectState = {
  id: IProject['id'];
  targets: Record<string, IProjectTargetState>;
};
