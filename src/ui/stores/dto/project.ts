export interface IProjectFlowActionStep {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  title: string;
  description: string;
  targets: string[];
}

export interface IProjectFlowActionParam {
  type: string;

  title?: string;
  description?: string;

  constraints?: {
    enum?: any[];
    min?: number;
    minLength?: number;
    max?: number;
    maxLength?: number;
    optional?: boolean;
  };
  initialValue: any;
}

export interface IProjectFlowAction {
  id: string;
  type: string;

  ref: { projectId: string; flowId: string; };
  
  title: string;
  description: string;

  steps: IProjectFlowActionStep[];
  params?: Record<string, IProjectFlowActionParam>;
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

  tags: string[];
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
