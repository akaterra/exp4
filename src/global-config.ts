import { IProjectDef } from './project';

export interface IGlobalConfigAuth {
  id: string;
  type: string;

  title: string;
  description: string;
  config: {
    integration: string;
    storage: string;
  } & Record<string, any>;
}

export interface IGlobalConfig {
  type: string;

  auth: Record<string, IGlobalConfigAuth>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
}
