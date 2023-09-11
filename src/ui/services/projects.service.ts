import { Status } from '../enums/status';
import { IProject, IProjectFlowAction, IProjectFlow, IProjectTarget } from '../stores/dto/project';
import { IProjectState } from '../stores/dto/project-state';
import { RestApiService } from './rest-api.service';

export class ProjectsService {
  protected rest = new RestApiService();

  list(): Promise<Record<string, IProject>> {
    return this.rest.get('projects');
  }

  async listState(projectId: IProject['id'], filter?: {
    targetId?: IProjectTarget['id'][],
  }): Promise<IProjectState> {
    const res: IProjectState = await this.rest.get(`projects/${projectId}/streams`, filter);

    for (const target of Object.values(res.targets)) {
      for (const streams of Object.values(target.streams)) {
        const lastAction = streams?.history?.action?.[0];
        const lastChange = streams?.history?.change?.[0];

        streams._label = lastAction?.status === Status.FAILED || lastChange?.status === Status.FAILED
          ? 'failure'
          : streams?.history?.artifact?.some((artefact) => {
            return typeof artefact.description === 'object'
              ? artefact.description?.level !== 'success'
              : false
          })
            ? 'warning'
            : 'default';
      }
    }

    return res;
  }

  listStatistics(id: IProject['id']): Promise<Record<string, any>> {
    return this.rest.get('statistics').then((res) => res?.projects?.[id] ?? {});
  }

  runAction(
    projectId: IProject['id'],
    flowId: IProjectFlow['id'],
    actionId: IProjectFlowAction['id'],
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ) {
    return this.rest.post(`projects/${projectId}/flow/${flowId}/action/${actionId}/run`, {
      targetsStreams,
      params,
    });
  }
}
