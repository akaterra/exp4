import { IProjectTarget } from './project';

export interface ITarget {
  projectTarget?: IProjectTarget;

  id: string;
  type: string;

  version?: string;
}
