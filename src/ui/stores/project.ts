export class ProjectStore {
  protected rest = new RestApiService();

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
}