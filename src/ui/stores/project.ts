import { makeObservable, observable, computed, action, flow } from 'mobx';
import { ProjectDto } from "./dto/project";
import { ProjectStateDto } from './dto/project-target-stream.state';
import { ProjectsService } from '../services/projects.service';
import { ProjectsStore } from './projects';

export class ProjectStore {
  protected service = new ProjectsService();

  project: Partial<ProjectDto> & { id: ProjectDto['id'] };
  projectTargetsState: ProjectStateDto['targets'];

  constructor(public projectsStore: ProjectsStore, public projectState?: ProjectStateDto['targets']) {
    makeObservable(this, {
      fetchState: flow,
      projectTargetsState: observable,
    });

    if (projectState) {
      this.projectTargetsState = projectState;
    }

    if (this.project && !this.projectTargetsState) {
      this.fetchState();
    }
  }

  getTargetByTargetId(targetId) {
    return this.project?.targets?.[targetId];
  }

  getTargetStreamByTargetIdAndStreamId(targetId, streamId) {
    return this.project?.targets?.[targetId]?.streams?.[streamId];
  }

  *fetchState() {
    const res = yield this.service.listState(this.project.id);

    this.projectTargetsState = res;
  }
}
