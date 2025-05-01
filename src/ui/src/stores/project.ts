import { makeObservable, observable, computed, flow } from 'mobx';
import { IProject, IProjectFlow, IProjectTarget, IProjectTargetStream } from "./dto/project";
import { IProjectState, IProjectTargetState, IProjectTargetStreamState } from './dto/project-state';
import { ProjectsStore } from './projects';
import { BaseStore } from './base-store';
import { modalStore } from '../blocks/modal';
import { ProjectActionRunModalContent, ProjectActionRunModalTitle } from '../blocks/project.action.run.modal';
import { detailsPanelStore } from '../blocks/details-panel';
import { ProjectTargetStreamDetailsModalContent, ProjectTargetStreamDetailsModalTitle } from '../blocks/project.target.stream.details-panel';
import { processing, saveContent, saveTextAligned, splitFilterTokens } from './utils';
import { alertsStore } from '../blocks/alerts';
import * as _ from 'lodash';
import { FormStore } from './form';
import {ProjectTargetReleaseModalContent, ProjectTargetReleaseModalTitle} from '../blocks/project.target.release.modal';

export class ProjectTargetStore extends BaseStore {
  @observable
    projectTargetState: IProjectTargetState;
  @observable
    selectedProjectTargetStreamIds: Record<string, boolean> = {};

  @computed
  get flows(): { flow: IProjectFlow, streamIds: IProjectTargetStream['id'][] | null }[] {
    if (this.projectStore.project?.flows) {
      const flows: { flow: IProjectFlow, streamIds: IProjectTargetStream['id'][] | null }[] = [];

      for (const flow of Object.values(this.projectStore.project?.flows)) {
        if (!flow.targets.includes(this.projectTargetState.id) || flow.ref?.streamId) {
          continue;
        }

        flows.push({
          flow,
          streamIds: null,
        });
      }

      return flows;
    }

    return [];
  }

  // @computed
  flowsForStream(streamId: IProjectTargetStream['id']): { flow: IProjectFlow, streamIds: IProjectTargetStream['id'][] | null }[] {
    if (this.projectStore.project?.flows) {
      const flows: { flow: IProjectFlow, streamIds: IProjectTargetStream['id'][] | null }[] = [];

      for (const flow of Object.values(this.projectStore.project?.flows)) {
        if (!flow.targets.includes(this.projectTargetState.id)) {
          continue;
        }

        flows.push({
          flow,
          streamIds: [ streamId ],
        });
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
        const streamState = this.projectTargetState?.streams?.[stream.id];

        if (this.projectStore.filterPlaced) {
          if (this.projectStore.mode?.target === ProjectStoreMode.ARTIFACTS) {
            if (!streamState?.history?.action?.length || !streamState?.history?.artifact?.length) {
              continue;
            }
          } else {
            if (!streamState?.history?.action?.length && !streamState?.history?.change?.length) {
              continue;
            }
          }
        }

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

        if (this.projectStore.filterPlaced) {
          if (this.projectStore.mode?.target === ProjectStoreMode.ARTIFACTS) {
            if (!streamState?.history?.action?.length || !streamState?.history?.artifact?.length) {
              continue;
            }
          } else {
            if (!streamState?.history?.action?.length && !streamState?.history?.change?.length) {
              continue;
            }
          }
        }

        if (this.projectStore.filterTargets) {
          let pass = true;

          for (const token of splitFilterTokens(this.projectStore.filterTargets, true)) {
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
          artifacts: filterArtifacts(stream, this.projectTargetState?.streams?.[stream.id], this.projectStore.filterTargets),
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
    return this.projectStore.projectTargetsStores?.[this.projectTargetState.id]?.projectTargetState;
  }

  @computed
  get targetStateStore() {
    return this.projectStore.projectTargetsStores?.[this.projectTargetState.id];
  }

  constructor(public projectStore: ProjectStore, projectTargetState: IProjectTargetState) {
    super();
    makeObservable(this);

    this.update(projectTargetState);
  }

  @flow
  *fetchState(streamIds: IProjectTargetStream['id'] | IProjectTargetStream['id'][] | true) {
    yield this.projectStore.fetchState(
      {
        [this.target.id]: streamIds,
      },
      [ '*', 'resync' ],
    );
  }

  @flow
  *fetchStateForMaybeSelectedStreamIds() {
    const selectedStreamIds = Object.keys(this.selectedProjectTargetStreamIds);

    yield this.fetchState(selectedStreamIds.length ? selectedStreamIds : true);
  }

  @flow @processing
  *applyArtifactsDownload() {
    yield saveTextAligned(
      Object.values(this.streamsWithStatesAndArtifacts).reduce((acc, val) => {
        for (const artifact of val.artifacts) {
          acc.push({
            'stream': val.stream.title ?? val.stream.id,
            'artifact id':  artifact.id,
            'artifact value': typeof artifact.description === 'string' ? artifact.description : artifact.description?.value,
          });
        }

        return acc;
      }, [] as any[]),
      'download', 'artifacts',
    );

    alertsStore.push({ level: 'success', value: 'Downloaded' });
  }

  @flow @processing
  *applyArtifactsExportToClipboard() {
    yield saveTextAligned(
      Object.values(this.streamsWithStatesAndArtifacts).reduce((acc, val) => {
        for (const artifact of val.artifacts) {
          acc.push({
            'stream': val.stream.title ?? val.stream.id,
            'artifact id': artifact.id,
            'artifact value': typeof artifact.description === 'string' ? artifact.description : artifact.description?.value,
          });
        }

        return acc;
      }, [] as any[]),
      'clipboard',
    );

    alertsStore.push({ level: 'success', value: 'Copied' });
  }

  @flow @processing
  *applyActionsAndChangesDownload() {
    yield saveTextAligned(
      Object.values(this.streamsWithStatesAndArtifacts).reduce((acc, val) => {
        for (const action of [ val.streamState?.history?.action?.[0] ?? null ]) {
          acc.push({
            'stream': val.stream.title ?? val.stream.id,
            'action': action?.description ?? action?.id,
            'change': val.streamState?.history?.change?.[0]?.description,
          });
        }

        return acc;
      }, [] as any[]),
      'download', 'actions-and-changes',
    );

    alertsStore.push({ level: 'success', value: 'Downloaded' });
  }

  @flow @processing
  *applyActionsAndChangesExportToClipboard() {
    yield saveTextAligned(
      Object.values(this.streamsWithStatesAndArtifacts).reduce((acc, val) => {
        for (const action of [ val.streamState?.history?.action?.[0] ?? null ]) {
          acc.push({
            'stream': val.stream.title ?? val.stream.id,
            'action': action?.description ?? action?.id,
            'change': val.streamState?.history?.change?.[0]?.description,
          });
        }

        return acc;
      }, [] as any[]),
      'clipboard',
    );

    alertsStore.push({ level: 'success', value: 'Copied' });
  }

  @flow @processing
  *applyRunFlow(streamId: IProjectTargetStream['id'] | null, flowId: IProjectFlow['id']) {
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

    yield this.projectStore.applyActionRun(this.target?.id, selectedStreamIds, flowId);
  }

  @flow @processing
  *applyRelease() {
    const action = yield modalStore.show({
      content: ProjectTargetReleaseModalContent,
      props: {
        // projectFlow: projectFlow,
        // projectFlowParamsStore,
        projectTargetStore: this,
        // projectTargetStreams: Object
        //   .values(this.getTargetByTargetId(targetId).streams)
        //   .filter((stream) => selectedStreamIds.includes(stream.id)),
      },
      // onBeforeSelect: (action) => action === 'ok' ? projectFlowParamsStore.__validateAll() : true,
      title: ProjectTargetReleaseModalTitle,
      withClose: true,
    });
  }

  @flow
  *applyStreamSelection(streamId: string) {
    if (this.selectedProjectTargetStreamIds[streamId]) {
      delete this.selectedProjectTargetStreamIds[streamId];
    } else {
      this.selectedProjectTargetStreamIds[streamId] = true;
    }
  }

  @flow
  *applyTargetStreamDetails(streamId: string | null) {
    yield this.projectStore.applyTargetStreamDetails(this.target?.id, streamId);
  }

  update(state?: Partial<IProjectTargetState>) {
    if (state) {
      this.projectTargetState = { ...this.projectTargetState, ...state };
    }

    return this;
  }
}

export class ProjectFlowParamsStore extends FormStore {
  constructor(public projectsStore: ProjectsStore, public projectFlow: IProjectFlow) {
    super(projectFlow.params ?? {});
  }
}

export enum ProjectStoreMode {
  ACTIONS_AND_CHANGES = 'actionsAndChanges',
  ARTIFACTS = 'artifacts',
  STREAMS = 'streams',
}

export class ProjectStore extends BaseStore {
  @observable
    filterPlaced: boolean = false;
  @observable
    filterTargets: string = '';
  @observable
    mode: {
      target?: ProjectStoreMode;
    } = {
      target: ProjectStoreMode.STREAMS,
    };
  @observable
    project: IProject;
  @observable
    projectStatistics: Record<string, any> = {};
  @observable
    projectTargetsStores: Record<string, ProjectTargetStore> = {};
  @observable
    selectedFlow: { stream: IProjectTargetStream | null, flow: IProjectFlow, targetStore: ProjectTargetStore } | null;
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
    targetId?: IProjectTarget['id'][] | Record<IProjectTarget['id'], IProjectTargetStream['id'] | IProjectTargetStream['id'][] | boolean>,
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
    yield saveContent(
      typeof artifact.description === 'string'
        ? artifact.description
        : artifact.description.value,
      'text',
      'clipboard',
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
  *applyActionRun(targetId: string, streamId: string | string[] | null, flowId?: string) {
    let selectedStreamIds: IProjectTargetStream['id'][];

    if (streamId) {
      selectedStreamIds = Array.isArray(streamId)
        ? streamId
        : [ streamId ];
    } else {
      selectedStreamIds = this.getTargetStoreByTargetId(targetId)
        ?.flows
        ?.find((action) => action.flow.id === flowId)?.streamIds ?? [];
    }

    const projectFlow = flowId ? this.project?.flows[flowId] : Object
      .values(this.project?.flows)
      .find((flow) => flow.targets.includes(targetId));
    const projectFlowParamsStore = new ProjectFlowParamsStore(
      this.projectsStore,
      projectFlow,
    );
    const action = yield modalStore.show({
      content: ProjectActionRunModalContent,
      props: {
        projectFlow: projectFlow,
        projectFlowParamsStore,
        projectTarget: this.getTargetByTargetId(targetId),
        projectTargetStreams: Object
          .values(this.getTargetByTargetId(targetId).streams)
          .filter((stream) => selectedStreamIds.includes(stream.id)),
      },
      onBeforeSelect: (action) => action === 'ok' ? projectFlowParamsStore.__validateAll() : true,
      title: ProjectActionRunModalTitle,
      withClose: true,
    });

    switch (action) {
    case 'cancel':
      break;
    case 'ok':
      yield this.projectsStore.service.runFlow(
        this.project.id,
        projectFlow?.id,
        {
          [targetId]: selectedStreamIds as [ string, ...string[] ],
        },
        projectFlowParamsStore.getState(),
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
