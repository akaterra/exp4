export interface IProjectRef {
  flowId?: IProjectFlow['id'],
  projectId?: IProject['id'],
  streamId?: IProjectTargetStream['id'],
  targetId?: IProjectTarget['id'],
}

export interface IProjectFlowAction {
  id: string;
  type: string;

  ref: IProjectRef;
  
  title: string;
  description: string;

  targets: string[];
  ui?: Array<string | Array<string>>;
}

export interface IProjectFlowActionParam {
  type: 'boolean' | 'enum' | 'number' | 'string' | 'value';

  title?: string;
  description?: string;

  constraints?: {
    enum?: unknown[];
    min?: number;
    minLength?: number;
    max?: number;
    maxLength?: number;
    optional?: boolean;
  };
  initialValue: unknown;
}

export interface IProjectFlow {
  id: string;
  type: string;

  ref: IProjectRef;

  title: string;
  description: string;

  targets: string[];
  actions: IProjectFlowAction[];
  params?: Record<string, IProjectFlowActionParam>;
  ui?: Array<string | Array<string>>;
}

export interface IProjectTargetStream {
  id: string;
  type: string;

  ref: IProjectRef;

  title: string;
  description: string;

  flows: Record<string, IProjectFlow>;
  tags: string[];
  targets: string[];

  _search: Set<string>;
}

export interface IProjectTarget {
  id: string;
  type: string;

  ref: IProjectRef;

  title: string;
  description: string;

  streams: Record<string, IProjectTargetStream>;
  tags: string[];
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
