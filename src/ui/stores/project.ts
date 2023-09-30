import { makeObservable, observable, computed, flow } from 'mobx';
import { IProject, IProjectFlowAction, IProjectTarget, IProjectTargetStream } from "./dto/project";
import { IProjectState, IProjectTargetState, IProjectTargetStreamState } from './dto/project-state';
import { ProjectsStore } from './projects';
import { BaseStore } from './base-store';
import { modalStore } from '../blocks/modal';
import { ProjectRunActionModalContent, ProjectRunActionModalTitle } from '../blocks/project.run-action.modal';
import { detailsPanelStore } from '../blocks/details-panel';
import { ProjectTargetStreamDetailsModalContent, ProjectTargetStreamDetailsModalTitle } from '../blocks/project.target-stream.details-panel';
import { processing, splitFilterTokens } from './utils';
import { alertsStore } from '../blocks/alerts';
import * as _ from 'lodash';
import { FormStore } from './form';

export class ProjectTargetStore extends BaseStore {
  @observable
    projectTargetState: IProjectTargetState;
  @observable
    selectedProjectTargetStreamIds: Record<string, boolean> = {};

  @computed
  get actions(): { action: IProjectFlowAction, streamIds: IProjectTargetStream['id'][] | null }[] {
    if (this.projectStore.project?.flows) {
      const actions: { action: IProjectFlowAction, streamIds: IProjectTargetStream['id'][] | null }[] = [];

      for (const flow of Object.values(this.projectStore.project?.flows)) {
        if (!flow.targets.includes(this.projectTargetState.id) || flow.ref?.streamId) {
          continue;
        }

        for (const action of Object.values(flow.actions)) {
          if (action.streams && Object.keys(this.selectedProjectTargetStreamIds).length) {
            actions.push({
              action,
              streamIds: action.streams.filter((actionStreamId) => this.selectedProjectTargetStreamIds[actionStreamId]),
            });

            continue;
          }

          actions.push({
            action,
            streamIds: action.streams ?? null,
          });
        }
      }

      return actions;
    }

    return [];
  }

  // @computed
  actionsForStream(streamId: IProjectTargetStream['id']): { action: IProjectFlowAction, streamIds: IProjectTargetStream['id'][] | null }[] {
    if (this.projectStore.project?.flows) {
      const actions: { action: IProjectFlowAction, streamIds: IProjectTargetStream['id'][] | null }[] = [];

      for (const flow of Object.values(this.projectStore.project?.flows)) {
        if (!flow.targets.includes(this.projectTargetState.id)) {
          continue;
        }

        for (const action of Object.values(flow.actions)) {
          if (action.streams) {
            actions.push({
              action,
              streamIds: action.streams.filter((actionStreamId) => actionStreamId === streamId),
            });

            continue;
          }

          actions.push({
            action,
            streamIds: action.streams ?? null,
          });
        }
      }

      return actions;
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
        const streamState = this.projectTargetState?.streams?.[stream.id];

        if (this.projectStore.filterTargets) {
          let pass = true;

          for (const token of splitFilterTokens(this.projectStore.filterTargets, true)) {
            const isExcluded = token.at(0) === '-';
            const tokenValue = isExcluded ? token.slice(1) : token;

            if (isExcluded) {
              if (stream._search.has(tokenValue)) {
                pass = false;
                break;
              }
            } else {
              if (!stream._search.has(tokenValue)) {
                pass = false;
                break;
              }
            }
          }

          if (!pass) {
            continue;
          }
        }

        streamsWithStates.push({
          stream,
          streamState,
          isSelected: !!this.selectedProjectTargetStreamIds[stream.id],
        });
      }

      return streamsWithStates;
    }

    return [];
  }

  @computed
  get streamsWithStatesAndArtifacts(): {
    stream: IProjectTargetStream,
    streamState: IProjectTargetStreamState,
    artifacts: IProjectTargetStreamState['history']['artifact'],
  }[] {
    if (this.target) {
      const streamsWithStates: {
        stream: IProjectTargetStream,
        streamState: IProjectTargetStreamState,
        artifacts: IProjectTargetStreamState['history']['artifact'],
      }[] = [];

      for (const stream of Object.values(this.target.streams)) {
        const streamState = this.projectTargetState?.streams?.[stream.id];

        if (this.projectStore.filterTargetsArtifacts) {
          let pass = true;

          for (const token of splitFilterTokens(this.projectStore.filterTargetsArtifacts, true)) {
            const isExcluded = token.at(0) === '-';
            const tokenValue = isExcluded ? token.slice(1) : token;

            if (isExcluded) {
              if (stream._search.has(tokenValue) || streamState._search.has(tokenValue)) {
                pass = false;
                break;
              }
            } else {
              if (!stream._search.has(tokenValue) && !streamState._search.has(tokenValue)) {
                pass = false;
                break;
              }
            }
          }

          if (!pass) {
            continue;
          }
        }

        streamsWithStates.push({
          stream,
          streamState,
          artifacts: filterArtifacts(stream, this.projectTargetState?.streams?.[stream.id], this.projectStore.filterTargetsArtifacts),
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
  *fetchState() {
    const selectedStreamIds = Object.keys(this.selectedProjectTargetStreamIds);

    yield this.projectStore.fetchState(
      {
        [this.target.id]: selectedStreamIds.length ? selectedStreamIds : true,
      },
      [ '*' ],
    );
  }

  @flow
  *applyTargetStreamDetails(streamId: string | null) {
    yield this.projectStore.applyTargetStreamDetails(this.target?.id, streamId);
  }

  @flow
  *applyRunAction(streamId: string | null, actionId: string | null, flowId?) {
    let selectedStreamIds: string[];

    if (!streamId) {
      selectedStreamIds = Object.keys(this.selectedProjectTargetStreamIds);

      if (!selectedStreamIds.length) {
        selectedStreamIds = Object.values(this.target.streams).map((stream) => stream.id);
      }

      selectedStreamIds = _.intersection(
        this.streamsWithStates.map(({ stream }) => stream.id),
        selectedStreamIds,
      );
    } else {
      selectedStreamIds = [ streamId ];
    }

    yield this.projectStore.applyRunAction(this.target?.id, selectedStreamIds, actionId, flowId);
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

export class ProjectFlowActionParamsStore extends FormStore {
  constructor(public projectsStore: ProjectsStore, public projectFlowAction: IProjectFlowAction) {
    super(projectFlowAction.params ?? {});
  }
}

export class ProjectStore extends BaseStore {
  @observable
    filterTargets: string = '';
  @observable
    filterTargetsArtifacts: string = '';
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
    selectedTab?: number | string = 0;

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
  *fetchState(
    targetId?: IProjectTarget['id'][] | Record<IProjectTarget['id'], IProjectTargetStream['id'][] | boolean>,
    scopes?: string[],
  ) {
    const res: IProjectState = yield this.projectsStore.service.listState(
      this.project.id,
      {
        targetId,
        scopes,
      },
    );

    this.projectTargetsStores = this.mapToStores(res.targets, (val, key) => {
      return this.projectTargetsStores[key]
        ? this.projectTargetsStores[key].update(val)
        : new ProjectTargetStore(this, val);
    }, this.projectTargetsStores);
    this.projectStatistics = yield this.projectsStore.service.listStatistics(this.project.id);
  }

  @flow @processing
  *applyArtifactCopyToClipboard(artifact: IProjectTargetStreamState['history']['artifact'][0]) {
    yield navigator.clipboard.writeText(
      typeof artifact.description === 'string'
        ? artifact.description
        : artifact.description.value
    );

    alertsStore.push({ level: 'success', value: 'Copied' });
  }

  @flow @processing
  *applyTargetStreamDetails(targetId: string, streamId: string) {
    const target = this.getTargetByTargetId(targetId);
    const targetStore = this.getTargetStoreByTargetId(targetId);
    yield detailsPanelStore.show({
      content: ProjectTargetStreamDetailsModalContent,
      props: {
        projectTargetStore: targetStore,
        projectTargetStream: target?.streams?.[streamId],
        projectTargetStreamState: targetStore?.projectTargetState?.streams[streamId],
      },
      title: ProjectTargetStreamDetailsModalTitle,
      withClose: true,
    });
  }

  @flow @processing
  *applyRunAction(targetId: string, streamId: string | string[] | null, actionId: string, flowId?: string) {
    let selectedStreamIds: IProjectTargetStream['id'][];

    if (streamId) {
      selectedStreamIds = Array.isArray(streamId)
        ? streamId
        : [ streamId ];
    } else {
      selectedStreamIds = this.getTargetStoreByTargetId(targetId)
        ?.actions
        ?.find((action) => action.action.id === actionId)?.streamIds ?? [];
    }

    const projectFlow = flowId ? this.project?.flows[flowId] : Object
      .values(this.project?.flows)
      .find((flow) => flow.targets.includes(targetId));
    const projectFlowAction = projectFlow?.actions?.[actionId];
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
      onBeforeSelect: (action) => action === 'ok' ? projectFlowActionParamsStore.__isValid : true,
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
        projectFlowActionParamsStore.getState(),
      );
      yield this.fetchState();

      break;
    }
  }
}

function filterArtifacts(stream: IProjectTargetStream, streamState: IProjectTargetStreamState, filter?: string): IProjectTargetStreamState['history']['artifact'] {
  if (!filter || !streamState?.history?.artifact?.length) {
    return streamState?.history?.artifact;
  }

  const filteredArtifacts: IProjectTargetStreamState['history']['artifact'] = [];
  
  for (const artifact of streamState?.history?.artifact) {
    let pass = true;

    for (const token of splitFilterTokens(filter, true)) {
      const isExcluded = token.at(0) === '-';
      const tokenValue = isExcluded ? token.slice(1) : token;
  
      if (isExcluded) {
        if (stream._search.has(tokenValue) || artifact._search.has(tokenValue)) {
          pass = false;
          break;
        }
      } else {
        if (!stream._search.has(tokenValue) && !artifact._search.has(tokenValue)) {
          pass = false;
          break;
        }
      }
    }

    if (pass) {
      filteredArtifacts.push(artifact);
    }
  }

  return filteredArtifacts;
}
