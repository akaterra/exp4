import { makeObservable, observable, computed, action, flow, reaction } from 'mobx';
import { ProjectDto } from "./dto/project";
import { ProjectStateDto, ProjectTargetStateDto } from './dto/project-target-stream.state';
import { ProjectsService } from '../services/projects.service';
import { ProjectsStore } from './projects';
import { BaseStore, processing } from './base-store';

export class ProjectTargetStore extends BaseStore {
  @computed
  get targetState() {
    return this.projectStore.projectTargetsStores[this.projectTargetState.id];
  }

  constructor(public projectStore: ProjectStore, public projectTargetState: { id: string, streams: ProjectTargetStateDto }) {
    super();
    makeObservable(this);
  }
}

export class ProjectStore extends BaseStore {
  @observable
  project: Partial<ProjectDto> & { id: ProjectDto['id'] };
  @observable
  projectTargetsStores: Record<string, ProjectTargetStore> = {};

  constructor(public projectsStore: ProjectsStore, public projectState?: ProjectStateDto['targets']) {
    super();
    makeObservable(this);

    if (this.project && !this.projectState) {
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
    const res = yield this.projectsStore.service.listState(this.project.id);

    this.projectTargetsStores = this.mapToStores(res, (val, key) => {
      return this.projectTargetsStores[key]
        ? this.projectTargetsStores[key].update(val)
        : new ProjectTargetStore(this, val);
    }, this.projectTargetsStores);
  }
}
