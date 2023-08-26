import { makeObservable, observable, computed, action, flow, reaction } from 'mobx';
import { ProjectDto, ProjectFlowDto, ProjectFlowActionDto, ProjectTargetStreamDto } from "./dto/project";
import { ProjectStateDto, ProjectTargetStateDto, ProjectTargetStreamStateDto } from './dto/project-state';
import { ProjectsService } from '../services/projects.service';
import { ProjectsStore } from './projects';
import { BaseStore, processing } from './base-store';

export class ProjectTargetStore extends BaseStore {
  @observable projectTargetState: ProjectTargetStateDto;

  @computed
  get actions(): ProjectFlowActionDto[] {
    if (this.projectStore.project?.flows) {
      const flows: ProjectFlowActionDto[] = [];

      for (const flow of Object.values(this.projectStore.project?.flows)) {
        if (flow.targets.includes(this.projectTargetState.id)) {
          flows.push(...Object.values(flow.actions));
        }
      }

      return flows;
    }

    return [];
  }

  @computed
  get streamsWithStates(): { stream: ProjectTargetStreamDto, streamState: ProjectTargetStreamStateDto }[] {
    if (this.target) {
      const streamsWithStates: { stream: ProjectTargetStreamDto, streamState: ProjectTargetStreamStateDto }[] = [];

      for (const stream of Object.values(this.target.streams)) {
        streamsWithStates.push({
          stream, streamState: this.projectTargetState?.streams?.[stream.id],
        });
      }

      return streamsWithStates;
    }

    return [];
  }

  @computed
  get target() {
    return this.projectStore.project?.targets?.[this.projectTargetState.id];
  }

  @computed
  get targetState() {
    return this.projectStore.projectTargetsStores?.[this.projectTargetState.id];
  }

  constructor(public projectStore: ProjectStore, projectTargetState: ProjectTargetStateDto) {
    super();
    makeObservable(this);

    this.update(projectTargetState);
  }

  selectAction(streamId: string | null, actionId: string | null) {
    this.selectStream(null);
    this.projectStore.selectTargetStreamAction(this.target?.id, streamId, actionId);
  }

  selectStream(streamId: string | null) {
    this.projectStore.selectTargetStream(this.target?.id, streamId);
  }

  update(state?: Partial<ProjectTargetStateDto>) {
    if (state) {
      this.projectTargetState = { ...this.projectTargetState, ...state };
    }

    return this;
  }
}

export class ProjectStore extends BaseStore {
  @observable
  project: ProjectDto;
  @observable
  projectTargetsStores: Record<string, ProjectTargetStore> = {};
  @observable
  selectedAction: { stream: ProjectTargetStreamDto | null, action: ProjectFlowActionDto, targetStore: ProjectTargetStore } | null;
  @observable
  selectedStreamWithState: { stream: ProjectTargetStreamDto, streamState: ProjectTargetStreamStateDto, targetStore: ProjectTargetStore } | null;

  constructor(public projectsStore: ProjectsStore, project: ProjectDto) {
    super();
    makeObservable(this);

    this.project = project;

    this.fetchState();
  }

  getTargetByTargetId(targetId) {
    return this.project?.targets?.[targetId];
  }

  getTargetStoreByTargetId(targetId) {
    return this.projectTargetsStores?.[targetId];
  }

  getTargetStreamByTargetIdAndStreamId(targetId, streamId) {
    return this.project?.targets?.[targetId]?.streams?.[streamId];
  }

  @flow @processing
  *fetchState() {
    const res: ProjectStateDto = yield this.projectsStore.service.listState(this.project.id);

    this.projectTargetsStores = this.mapToStores(res.targets, (val, key) => {
      return this.projectTargetsStores[key]
        ? this.projectTargetsStores[key].update(val)
        : new ProjectTargetStore(this, val);
    }, this.projectTargetsStores);
  }

  @flow @processing
  *applyTargetStreamAction(targetId: string | null, streamId: string | null, actionId: string) {
    this.selectedAction = null;
  }

  selectTargetStream(targetId: string | null, streamId: string | null) {
    if (targetId && streamId) {
      const target = this.getTargetByTargetId(targetId);
      const targetStore = this.getTargetStoreByTargetId(targetId);

      this.selectedStreamWithState = {
        stream: target?.streams?.[streamId],
        streamState: targetStore?.projectTargetState?.streams[streamId],
        targetStore,
      };
    } else {
      this.selectedStreamWithState = null;
    }
  }

  selectTargetStreamAction(targetId: string | null, streamId: string | null, actionId: string | null) {
    if (targetId && actionId) {
      const target = this.getTargetByTargetId(targetId);
      const targetStore = this.getTargetStoreByTargetId(targetId);

      this.selectedAction = {
        stream: streamId ? target?.streams?.[streamId] : null,
        action: Object.values(this.project?.flows).find((flow) => flow.targets.includes(targetId))?.actions?.[actionId]!,
        targetStore,
      };
      console.log(this.selectedAction);
    } else {
      this.selectedAction = null;
    }
  }
}
