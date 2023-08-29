export interface IProjectFlowActionStep {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  title: string;
  description: string;
  targets: string[];
}

export interface IProjectFlowAction {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  title: string;
  description: string;
  steps: IProjectFlowActionStep[];
}

export interface IProjectFlow {
  id: string;
  type: string;

  title: string;
  desription: string;
  actions: Record<string, IProjectFlowAction>;
  targets: string[];
}

export interface ProjectTargetStreamDto {
  id: string;
  type: string;

  ref: { projectId: string; targetId: string; };

  title: string;
  description: string;
  targets: string[];
}

export interface IProjectTarget {
  id: string;
  type: string;

  ref: { projectId: string; };

  title: string;
  description: string;
  streams: Record<string, ProjectTargetStreamDto>;
  versioning: string;
}

export interface IProject {
  id: string;
  type: string;

  title: string;
  description: string;
  flows: Record<string, IProjectFlow>;
  targets: Record<string, IProjectTarget>;
}
