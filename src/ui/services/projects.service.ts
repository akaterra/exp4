import { ProjectDto, ProjectFlowActionDto, ProjectFlowDto, ProjectTargetDto } from '../stores/dto/project';
import { ProjectStateDto } from '../stores/dto/project-state';
import { RestApiService } from './rest-api.service';

export class ProjectsService {
  protected rest = new RestApiService();

  list(): Promise<Record<string, ProjectDto>> {
    return this.rest.get('projects');
  }

  listState(projectId: ProjectDto['id'], filter?: {
    targetId?: ProjectTargetDto['id'][],
  }): Promise<ProjectStateDto> {
    return this.rest.get(`projects/${projectId}/streams`, filter);
  }

  runAction(projectId: ProjectDto['id'], flowId: ProjectFlowDto['id'], actionId: ProjectFlowActionDto['id']) {
    return this.rest.post(`projects/${projectId}/flow/${flowId}/action/${actionId}/run`);
  }
}
