import { ProjectDto, ProjectTarget } from '../stores/dto/project';
import { ProjectStateDto } from '../stores/dto/project-target-stream.state';
import { RestApiService } from './rest-api.service';

export class ProjectsService {
  protected rest = new RestApiService();

  list(): Promise<Record<string, ProjectDto>> {
    return this.rest.get('projects');
  }

  listState(projectId: ProjectDto['id'], filter?: {
    targetId?: ProjectTarget['id'][],
  }): Promise<ProjectStateDto['targets']> {
    return this.rest.get(`projects/${projectId}/streams`, filter);
  }
}
