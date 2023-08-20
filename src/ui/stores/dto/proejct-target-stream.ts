export interface ProjectTargetStreamDto = {
  id: string;
  type: string;

  projectId: string;
  targetId: string;

  description: string;
  version: string;
}
