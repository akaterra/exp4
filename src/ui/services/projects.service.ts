import { ProjectDto, ProjectTarget } from '../stores/dto/project';
import { ProjectTargetStreamState, ProjectTargets } from '../stores/dto/project-target-stream.state';
import { RestApiService } from './rest-api.service';

export class ProjectsService {
  protected rest = new RestApiService();

  list(): Promise<Record<string, ProjectDto>> {
    return this.rest.get('projects');
  }

  listStreams(projectId: ProjectDto['id'], filter?: {
    targetId?: ProjectTarget['id'][],
  }): Promise<ProjectTargets> {
    return this.rest.get(`projects/${projectId}/streams`, filter);
  }
}
