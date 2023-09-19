import { Status } from '../enums/status';
import { IProject, IProjectFlowAction, IProjectFlow, IProjectTarget } from '../stores/dto/project';
import { IProjectState } from '../stores/dto/project-state';
import {splitFilterTokens} from '../stores/utils';
import { RestApiService } from './rest-api.service';

export class ProjectsService {
  protected rest = new RestApiService();

  async list(): Promise<Record<string, IProject>> {
    const res: Record<string, IProject> = await this.rest.get('projects');

    for (const project of Object.values(res)) {
      for (const target of Object.values(project.targets)) {
        for (const stream of Object.values(target.streams)) {
          const search = stream._search = new Set<string>();

          for (const token of splitFilterTokens(stream.title)) {
            search.add(token);
          }

          for (const tag of stream.tags ?? []) {
            search.add(`:${tag}`);
          }
        }
      }
    }

    return res;
  }

  async listState(projectId: IProject['id'], filter?: {
    targetId?: IProjectTarget['id'][],
    scopes?: string[],
  }): Promise<IProjectState> {
    const res: IProjectState = await this.rest.get(`projects/${projectId}/streams`, filter);

    for (const target of Object.values(res.targets)) {
      for (const stream of Object.values(target.streams)) {
        const lastAction = stream?.history?.action?.[0];
        const lastChange = stream?.history?.change?.[0];

        if (lastAction?.status === Status.FAILED || lastChange?.status === Status.FAILED) {
          stream._label = 'failure';
        } else if (lastAction?.status === Status.PROCESSING || lastChange?.status === Status.PROCESSING) {
          stream._label = 'warning';
        } else if (
          stream?.history?.artifact?.some((artifact) => {
            return typeof artifact.description === 'object'
              ? artifact.description?.level !== 'success'
              : false
          })
        ) {
          stream._label = 'warning';
        } else {
          stream._label = 'default';
        }

        const search = stream._search = new Set<string>();

        for (const artifact of stream.history.artifact ?? []) {
          artifact._search = new Set<string>();

          for (const token of splitFilterTokens(artifact.id)) {
            artifact._search.add(token);
            search.add(token);
          }
        }
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
