import { ProjectTargetStream } from './project';

export interface ProjectTargetStreamStateDto {
  id: ProjectTargetStream['id'];
  type: ProjectTargetStream['id'];

  ref: ProjectTargetStream['ref'];

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

export type ProjectTargetStateDto = Record<string, ProjectTargetStreamStateDto>;

export type ProjectStateDto = {
  targets: Record<string, ProjectTargetStateDto>;
};
