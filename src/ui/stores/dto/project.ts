export interface ProjectFlowActionStep = {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  description: string;
  targets: string[];
}

export interface ProjectFlowAction = {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  description: string;
  steps: ProjectFlowActionStep[];
}

export interface ProjectFlow = {
  id: string;
  type: string;

  desription: string;
  actions: Record<string, ProjectFlowAction>;
  targets: string[];
}

export interface ProjectTargetStream = {
  id: string;
  type: string;

  ref: { projectId: string; targetId: string; };

  description: string;
  targets: string[];
}

export interface ProjectTarget = {
  id: string;
  type: string;

  ref: { projectId: string; };

  description: string;
  streams: Record<string, ProjectTargetStream>;
  versioning: string;
}

export interface ProjectDto = {
  id: string;
  type: string;

  description: string;
  flows: Record<string, ProjectFlow>;
  targets: Record<string, ProjectTarget>;
}
