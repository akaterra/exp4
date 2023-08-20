import { makeObservable, observable, computed, action, flow } from "mobx"
import { RestApiService } from '../services/rest-api.service';
import { ProjectDto } from './dto/project';

export class ProjectsStore {
  protected rest = new RestApiService();

  protected projects: Record<string, ProjectDto> = {};

  constructor(value) {
    makeObservable(this, {
      fetch: flow,
      projects: observable,
    });
  }

  *fetch() {
    const response = yield this.rest.get("/api/projects");
    this.value = response.json();
  }
}
