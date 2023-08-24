export interface ProjectFlowActionStepDto {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  title: string;
  description: string;
  targets: string[];
}

export interface ProjectFlowActionDto {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  title: string;
  description: string;
  steps: ProjectFlowActionStepDto[];
}

export interface ProjectFlowDto {
  id: string;
  type: string;

  title: string;
  desription: string;
  actions: Record<string, ProjectFlowActionDto>;
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

export interface ProjectTargetDto {
  id: string;
  type: string;

  ref: { projectId: string; };

  title: string;
  description: string;
  streams: Record<string, ProjectTargetStreamDto>;
  versioning: string;
}

export interface ProjectDto {
  id: string;
  type: string;

  title: string;
  description: string;
  flows: Record<string, ProjectFlowDto>;
  targets: Record<string, ProjectTargetDto>;
}
