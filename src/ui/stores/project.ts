import { makeObservable, observable, computed, flow } from 'mobx';
import { IProject, IProjectFlowAction, IProjectTargetStream } from "./dto/project";
import { IProjectState, IProjectTargetState, IProjectTargetStreamState } from './dto/project-state';
import { ProjectsStore } from './projects';
import { BaseStore } from './base-store';
import { modalStore } from '../blocks/modal';
import { ProjectRunActionModalContent, ProjectRunActionModalTitle } from '../blocks/project.run-action.modal';
import { detailsPanelStore } from '../blocks/details-panel';
import { ProjectTargetStreamDetailsModalContent, ProjectTargetStreamDetailsModalTitle } from '../blocks/project.target-stream.details-panel';
import { processing } from './utils';

export class ProjectTargetStore extends BaseStore {
  @observable
    projectTargetState: IProjectTargetState;
  @observable
    selectedProjectTargetStreamIds: Record<string, boolean> = {};

  @computed
  get actions(): IProjectFlowAction[] {
    if (this.projectStore.project?.flows) {
      const flows: IProjectFlowAction[] = [];

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
  get streamsWithStates(): {
    stream: IProjectTargetStream,
    streamState: IProjectTargetStreamState,
    isSelected: boolean,
  }[] {
    if (this.target) {
      const streamsWithStates: {
        stream: IProjectTargetStream,
        streamState: IProjectTargetStreamState,
        isSelected: boolean,
      }[] = [];

      for (const stream of Object.values(this.target.streams)) {
        streamsWithStates.push({
          stream,
          streamState: this.projectTargetState?.streams?.[stream.id],
          isSelected: !!this.selectedProjectTargetStreamIds[stream.id],
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

  constructor(public projectStore: ProjectStore, projectTargetState: IProjectTargetState) {
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

  update(state?: Partial<IProjectTargetState>) {
    if (state) {
      this.projectTargetState = { ...this.projectTargetState, ...state };
    }

    return this;
  }
}

export class ProjectFlowActionParamsStore extends BaseStore {
  @observable
    isValid: boolean = true;
  @observable
    projectFlowAction: IProjectFlowAction;
  @observable
    paramsErrors: Record<string, string | null> = {};
  @observable
    paramsValues: Record<string, any> = {};

  constructor(public projectsStore: ProjectsStore, projectFlowAction: IProjectFlowAction) {
    super();
    makeObservable(this);

    this.projectFlowAction = projectFlowAction;

    if (projectFlowAction.params) {
      for (const [ key, val ] of Object.entries(projectFlowAction.params)) {
        this.paramsValues[key] = val.initialValue;
      }
    }
  }

  setValue(key, val) {
    if (val !== '') {
      this.paramsValues[key] = val;
    } else {
      this.paramsValues[key] = undefined;
    }
  }

  validate() {
    const params = this.projectFlowAction.params;
    let isValid = true;

    if (params) {
      for (const [ key, val ] of Object.entries(this.paramsValues)) {
        const constraints = params[key].constraints;

        if (constraints) {
          const errors: string[] = [];

          if (typeof constraints.optional === 'boolean' && !constraints.optional && (val === '' || val === undefined)) {
            errors.push('Required');
          }

          if (constraints.optional && (val === '' || val === undefined)) {
            this.paramsErrors[key] = null;

            continue;
          }

          if (Array.isArray(constraints.enum) && !constraints.enum.includes(val)) {
            errors.push(`Only ${constraints.enum.map((e) => `"${e}"`).join(', ')} values allowed`);
          }

          if (typeof constraints.max === 'number' && parseInt(val) > constraints.max) {
            errors.push(`${constraints.max} is a max value`);
          }

          if (typeof constraints.maxLength === 'number' && (val?.length ?? 0) > constraints.maxLength) {
            errors.push(`Max ${constraints.maxLength} ${constraints.maxLength === 1 ? 'symbol is' : 'symbols are'} allowed`);
          }

          if (typeof constraints.min === 'number' && parseInt(val) < constraints.min) {
            errors.push(`${constraints.min} is a min value`);
          }

          if (typeof constraints.minLength === 'number' && (val?.length ?? 0) < constraints.minLength) {
            errors.push(`Min ${constraints.minLength} ${constraints.minLength === 1 ? 'symbol' : 'symbols'} required`);
          }

          if (errors.length) {
            this.paramsErrors[key] = errors.join(', ');
          } else {
            if (this.paramsErrors[key]) {
              this.paramsErrors[key] = null;
            }
          }

          if (errors.length) {
            isValid = false;
          }
        }
      }

      if (this.isValid !== isValid) {
        this.isValid = isValid;

        modalStore.updateButtonState('ok', { disabled: !isValid });
      }
    }

    return isValid;
  }
}

export class ProjectStore extends BaseStore {
  @observable
    project: IProject;
  @observable
    projectStatistics: Record<string, any> = {};
  @observable
    projectTargetsStores: Record<string, ProjectTargetStore> = {};
  @observable
    selectedAction: { stream: IProjectTargetStream | null, action: IProjectFlowAction, targetStore: ProjectTargetStore } | null;
  @observable
    selectedStreamWithState: { stream: IProjectTargetStream, streamState: IProjectTargetStreamState, targetStore: ProjectTargetStore } | null;
  @observable
    selectedTab: number = 0;

  constructor(public projectsStore: ProjectsStore, project: IProject) {
    super();
    makeObservable(this);

    this.project = project;
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
    const res: IProjectState = yield this.projectsStore.service.listState(this.project.id);

    this.projectTargetsStores = this.mapToStores(res.targets, (val, key) => {
      return this.projectTargetsStores[key]
        ? this.projectTargetsStores[key].update(val)
        : new ProjectTargetStore(this, val);
    }, this.projectTargetsStores);
    this.projectStatistics = yield this.projectsStore.service.listStatistics(this.project.id);
  }

  @flow @processing
  *applyTargetStreamDetails(targetId: string, streamId: string) {
    const target = this.getTargetByTargetId(targetId);
    const targetStore = this.getTargetStoreByTargetId(targetId);
    yield detailsPanelStore.show({
      content: ProjectTargetStreamDetailsModalContent,
      props: {
        projectTarget: this.getTargetStoreByTargetId(targetId),
        projectTargetStream: target?.streams?.[streamId],
        projectTargetStreamState: targetStore?.projectTargetState?.streams[streamId],
      },
      title: ProjectTargetStreamDetailsModalTitle,
      withClose: true,
    });
  }

  @flow @processing
  *applyRunAction(targetId: string, streamId: string | string[] | null, actionId: string) {
    const selectedStreamIds = streamId
      ? Array.isArray(streamId) ? streamId : [ streamId ]
      : Object.values(this.getTargetByTargetId(targetId).streams).map((stream) => stream.id);
    const projectFlow = Object
      .values(this.project?.flows)
      .find((flow) => flow.targets.includes(targetId));
    const projectFlowAction = projectFlow?.actions?.[actionId] ?? this.getTargetStreamByTargetIdAndStreamId(
      targetId, selectedStreamIds[0]
    )?.actions?.[actionId];
console.log({actionId, projectFlowAction, x:this.getTargetStreamByTargetIdAndStreamId(
  targetId, selectedStreamIds[0]
), targetId, selectedStreamIds})
    const projectFlowActionParamsStore = new ProjectFlowActionParamsStore(
      this.projectsStore,
      projectFlowAction,
    );
    const action = yield modalStore.show({
      content: ProjectRunActionModalContent,
      props: {
        projectFlowAction,
        projectFlowActionParamsStore,
        projectTarget: this.getTargetByTargetId(targetId),
        projectTargetStreams: Object
          .values(this.getTargetByTargetId(targetId).streams)
          .filter((stream) => selectedStreamIds.includes(stream.id)),
      },
      onBeforeSelect: (action) => action === 'ok' ? projectFlowActionParamsStore.validate() : true,
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
          [targetId]: selectedStreamIds as [ string, ...string[] ],
        },
        projectFlowActionParamsStore.paramsValues,
      );
      yield this.fetchState();

      break;
    }
  }
}
