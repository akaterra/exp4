import { ProjectDto, ProjectTargetDto, ProjectTargetStreamDto } from './project';

export interface ProjectTargetStreamStateDto {
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

export type ProjectTargetStateDto = {
  id: ProjectTargetDto['id'];
  streams: Record<string, ProjectTargetStreamStateDto>;
  version: string;
};

export type ProjectStateDto = {
  id: ProjectDto['id'];
  targets: Record<string, ProjectTargetStateDto>;
};
