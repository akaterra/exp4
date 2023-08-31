import { IProject, IProjectFlowAction, IProjectFlow, IProjectTarget } from '../stores/dto/project';
import { IProjectState } from '../stores/dto/project-state';
import { RestApiService } from './rest-api.service';

export class ProjectsService {
  protected rest = new RestApiService();

  list(): Promise<Record<string, IProject>> {
    return this.rest.get('projects');
  }

  listState(projectId: IProject['id'], filter?: {
    targetId?: IProjectTarget['id'][],
  }): Promise<IProjectState> {
    return this.rest.get(`projects/${projectId}/streams`, filter);
  }

  runAction(
    projectId: IProject['id'],
    flowId: IProjectFlow['id'],
    actionId: IProjectFlowAction['id'],
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
  ) {
    return this.rest.post(`projects/${projectId}/flow/${flowId}/action/${actionId}/run`, targetsStreams);
  }
}