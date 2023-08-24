import { makeObservable, observable, computed, action, flow } from 'mobx';
import { RestApiService } from '../services/rest-api.service';
import { ProjectDto } from './dto/project';
import { ProjectsService } from '../services/projects.service';
import { BaseStore, processing } from './base-store';
import { ProjectStore } from './project';

export class ProjectsStore extends BaseStore {
  readonly service = new ProjectsService();

  @observable
  projects: Record<string, ProjectDto> = {};
  @observable
  projectsStores: Record<string, ProjectStore> = {};
  @observable
  selectedProjectId: string;

  @computed
  get selectedProjectStore() {
    return this.selectedProjectId ? this.projectsStores?.[this.selectedProjectId] : undefined;
  }

  @computed
  get projectsList() {
    return Object.values(this.projects);
  }

  constructor(selectedProjectId: string = 'test') {
    super();
    makeObservable(this);

    if (selectedProjectId) {
      this.selectedProjectId = selectedProjectId;
    }

    this.fetch();
  }

  getById(id) {
    return this.projects?.[id];
  }

  @flow @processing
  *fetch() {
    const res: Record<string, ProjectDto> = yield this.service.list();

    this.projects = res;
    this.projectsStores = this.mapToStores(res, (val, key) => {
      const payload = val;

      return this.projectsStores[key]
        ? this.projectsStores[key].update(payload)
        : new ProjectStore(this, payload);
    }, this.projectsStores);

    console.log(this)
  }
}
