import { makeObservable, observable, computed, action, flow } from 'mobx';
import { ProjectDto } from "./dto/project";
import { ProjectStateDto } from './dto/project-target-stream.state';
import { ProjectsService } from '../services/projects.service';

export class ProjectStore {
  protected service = new ProjectsService();

  project: Partial<ProjectDto> & { id: ProjectDto['id'] };
  projectTargetsState: ProjectStateDto['targets'];

  constructor(state?: { project?: ProjectDto, projectState?: ProjectStateDto['targets'] }) {
    makeObservable(this, {
      fetchState: flow,
      projectTargetsState: observable,
    });

    if (state?.project) {
      this.project = state.project;
    }

    if (state?.projectState) {
      this.projectTargetsState = state.projectState;
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
