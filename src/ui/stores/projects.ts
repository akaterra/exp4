import { makeObservable, observable, computed, action, flow } from 'mobx';
import { RestApiService } from '../services/rest-api.service';
import { ProjectDto } from './dto/project';
import { ProjectsService } from '../services/projects.service';

export class ProjectsStore {
  protected service = new ProjectsService();

  projects: Record<string, ProjectDto> = {};

  get projectsList() {
    return Object.values(this.projects);
  }

  constructor(value?) {
    makeObservable(this, {
      fetch: flow,
      projects: observable,
      projectsList: computed,
    });
  }

  getById(id) {
    return this.projects?.[id];
  }

  *fetch() {
    const res = yield this.service.list();

    this.projects = res;
  }
}
