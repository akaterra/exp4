import { makeObservable, observable, computed, action, flow, reaction } from 'mobx';
import { ProjectDto, ProjectFlowDto, ProjectFlowActionDto, ProjectTargetStreamDto } from "./dto/project";
import { ProjectStateDto, ProjectTargetStateDto, ProjectTargetStreamStateDto } from './dto/project-state';
import { ProjectsStore } from './projects';
import { BaseStore, processing } from './base-store';
import { modalStore } from '../blocks/modal';
import { ProjectRunActionModalContent, ProjectRunActionModalTitle } from '../blocks/project.run-action.modal';
import { detailsPanelStore } from '../blocks/details-panel';
import { ProjectTargetStreamDetailsModalContent, ProjectTargetStreamDetailsModalTitle } from '../blocks/project.target-stream.details-panel';

export class ProjectTargetStore extends BaseStore {
  @observable projectTargetState: ProjectTargetStateDto;
  @observable selectedProjectTargetStreamIds: Record<string, boolean> = {};

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
  get streamsWithStates(): { stream: ProjectTargetStreamDto, streamState: ProjectTargetStreamStateDto, isSelected: boolean }[] {
    if (this.target) {
      const streamsWithStates: { stream: ProjectTargetStreamDto, streamState: ProjectTargetStreamStateDto, isSelected: boolean }[] = [];

      for (const stream of Object.values(this.target.streams)) {
        streamsWithStates.push({
          stream, streamState: this.projectTargetState?.streams?.[stream.id], isSelected: !!this.selectedProjectTargetStreamIds[stream.id],
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

  @flow
  *applyTargetStreamDetails(streamId: string | null) {
    yield this.projectStore.applyTargetStreamDetails(this.target?.id, streamId);
  }

  @flow
  *applyRunAction(streamId: string | null, actionId: string | null) {
    let selectedStreamIds: string[];

    if (!streamId) {
      selectedStreamIds = Object.keys(this.selectedProjectTargetStreamIds);

      if (!selectedStreamIds.length) {
        selectedStreamIds = Object.keys(this.target.streams);
      }
    } else {
      selectedStreamIds = [ streamId ];
    }

    yield this.projectStore.applyRunAction(this.target?.id, selectedStreamIds, actionId);
  }

  @flow
  *applyStreamSelection(streamId: string) {
    if (this.selectedProjectTargetStreamIds[streamId]) {
      delete this.selectedProjectTargetStreamIds[streamId];
    } else {
      this.selectedProjectTargetStreamIds[streamId] = true;
    }
  }

  selectAction(streamId: string | null, actionId: string | null) {
    this.projectStore.selectTargetStreamAction(this.target?.id, streamId, actionId);
  }

  selectStreamInfo(streamId: string | null) {
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
  *applyTargetStreamDetails(targetId: string | null, streamId: string | null) {
    modalStore.hide();

    this.selectTargetStream(targetId, streamId);

    const action = yield detailsPanelStore.show({
      content: ProjectTargetStreamDetailsModalContent,
      props: {
        projectTarget: this.getTargetStoreByTargetId(targetId),
      },
      title: ProjectTargetStreamDetailsModalTitle,
      withClose: true,
    });
  }

  @flow @processing
  *applyRunAction(targetId: string | null, streamId: string | string[] | null, actionId: string | null) {
    detailsPanelStore.hide();

    const selectedStreamIds = streamId
      ? Array.isArray(streamId) ? streamId : [ streamId ]
      : Object.values(this.getTargetByTargetId(targetId).streams).map((stream) => stream.id);
    const projectFlow = Object
      .values(this.project?.flows)
      .find((flow) => flow.targets.includes(targetId));

    const action = yield modalStore.show({
      content: ProjectRunActionModalContent,
      props: {
        projectTarget: this.getTargetByTargetId(targetId),
        projectTargetActions: projectFlow?.actions?.[actionId],
        projectTargetStreams: Object
          .values(this.getTargetByTargetId(targetId).streams)
          .filter((stream) => selectedStreamIds.includes(stream.id)),
      },
      title: ProjectRunActionModalTitle,
      withClose: true,
    });

    switch (action) {
      case 'cancel':
        break;
      case 'ok':
        yield this.projectsStore.service.runAction(
          this.project.id,
          projectFlow?.id,
          actionId,
          {
            [ targetId ]: selectedStreamIds as [ string, ...string[] ],
          }
        );
        yield this.fetchState();

        break;
    }
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
    } else {
      this.selectedAction = null;
    }
  }
}
