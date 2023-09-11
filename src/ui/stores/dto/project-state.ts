import { Status } from '../../enums/status';
import { IProject, IProjectTarget, IProjectTargetStream } from './project';

export interface IStreamHistoryStep {
  id: string;
  type: string;

  description: string;
  link: string;
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

  _label: 'default' | 'failure' | 'success' | 'warning';
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
