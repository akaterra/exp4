import { makeObservable, observable, computed, flow } from 'mobx';
import { IProject } from './dto/project';
import { ProjectsService } from '../services/projects.service';
import { BaseStore } from './base-store';
import { ProjectStore } from './project';
import { processing } from './utils';

export class ProjectsStore extends BaseStore {
  readonly service = new ProjectsService();

  @observable
    projects: Record<string, IProject> = {};
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

  constructor(selectedProjectId?: string) {
    super();
    makeObservable(this);

    if (selectedProjectId) {
      this.selectedProjectId = selectedProjectId;
    }
  }

  getById(id) {
    return this.projects?.[id];
  }

  @flow @processing
  *fetch() {
    const res: Record<string, IProject> = yield this.service.list();

    this.projects = res;
    this.projectsStores = this.mapToStores(res, (val, key) => {
      const payload = val;

      return this.projectsStores[key]
        ? this.projectsStores[key].update(payload)
        : new ProjectStore(this, payload);
    }, this.projectsStores);

    if (this.selectedProjectId) {
      yield this.fetchProject(this.selectedProjectId);
    }
  }

  @flow @processing
  *fetchProject(id: IProject['id']) {
    this.selectedProjectId = id;
    
    yield this.selectedProjectStore?.fetchState();
  }
}
