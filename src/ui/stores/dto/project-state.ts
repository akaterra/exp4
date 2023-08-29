import { IProject, IProjectTarget, ProjectTargetStreamDto } from './project';

export interface IProjectTargetStreamState {
  id: ProjectTargetStreamDto['id'];
  type: ProjectTargetStreamDto['id'];

  ref: ProjectTargetStreamDto['ref'];

  history: {
    action: {
      id: string;
      type: string;

      author: { name: string; link: string; };
      description: string;
      link: string;
      metadata: Record<string, unknown>;
      status: string;
      time: string;
    }[];
    change: {
      id: string;
      type: string;

      author: { name: string; link: string; };
      description: string;
      link: string;
      metadata: Record<string, unknown>;
      status: string;
      time: string;
    }[];
  };
  link: string;
  metadata: Record<string, unknown>;
  version: string;
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
