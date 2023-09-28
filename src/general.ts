import { IProjectDef } from './project';

export interface IGeneralManifestAuth {
  id: string;
  type: string;

  title: string;
  description: string;
  config: {
    integration: string;
    storage: string;
  } & Record<string, any>;
}

export interface IGeneralManifest {
  id?: string;
  type: string;

  auth: Record<string, IGeneralManifestAuth>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
}
