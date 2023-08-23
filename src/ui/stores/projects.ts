import { makeObservable, observable, computed, action, flow } from 'mobx';
import { RestApiService } from '../services/rest-api.service';
import { ProjectDto } from './dto/project';
import { ProjectsService } from '../services/projects.service';
import { BaseStore, processing } from './base-store';

export class ProjectsStore extends BaseStore {
  readonly service = new ProjectsService();

  @observable
  projects: Record<string, ProjectDto> = {};

  @computed
  get projectsList() {
    return Object.values(this.projects);
  }

  constructor(state?) {
    super();
    makeObservable(this);

    this.fetch();
  }

  getById(id) {
    return this.projects?.[id];
  }

  @flow @processing
  *fetch() {
    const res = yield this.service.list();

    this.projects = res;
  }
}
