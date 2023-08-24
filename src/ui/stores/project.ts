import { makeObservable, observable, computed, action, flow, reaction } from 'mobx';
import { ProjectDto } from "./dto/project";
import { ProjectStateDto, ProjectTargetStateDto } from './dto/project-target-stream.state';
import { ProjectsService } from '../services/projects.service';
import { ProjectsStore } from './projects';
import { BaseStore, processing } from './base-store';

export class ProjectTargetStore extends BaseStore {
  @observable projectTargetState: { id: string };

  @computed
  get target() {
    return this.projectStore.project?.targets?.[this.projectTargetState.id];
  }

  @computed
  get targetState() {
    return this.projectStore.projectTargetsStores?.[this.projectTargetState.id];
  }

  constructor(public projectStore: ProjectStore, projectTargetState: { id: string }) {
    super();
    makeObservable(this);

    this.update(projectTargetState);
  }

  update(state?: { id: string }) {
    if (state) {
      this.projectTargetState = state;
    }

    return this;
  }
}

export class ProjectStore extends BaseStore {
  @observable
  project: ProjectDto;
  @observable
  projectTargetsStores: Record<string, ProjectTargetStore> = {};

  constructor(public projectsStore: ProjectsStore, project?: ProjectDto) {
    super();
    makeObservable(this);

    if (project) {
      this.project = project;

      this.fetchState();
    }
  }

  getTargetByTargetId(targetId) {
    return this.project?.targets?.[targetId];
  }

  getTargetStreamByTargetIdAndStreamId(targetId, streamId) {
    return this.project?.targets?.[targetId]?.streams?.[streamId];
  }

  @flow @processing
  *fetchState() {
    const res: ProjectStateDto['targets'] = yield this.projectsStore.service.listState(this.project.id);

    this.projectTargetsStores = this.mapToStores(res, (val, key) => {
      const payload = { id: key };

      return this.projectTargetsStores[key]
        ? this.projectTargetsStores[key].update(payload)
        : new ProjectTargetStore(this, payload);
    }, this.projectTargetsStores);
  }
}
