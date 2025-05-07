import { makeObservable, observable, computed, flow, IComputedFactory, IObservableFactory } from 'mobx';
import { IProject, IProjectFlow, IProjectTarget, IProjectTargetStream } from "./dto/project";
import { IProjectState, IProjectTargetState, IProjectTargetStreamState } from './dto/project-state';
import { ProjectsStore } from './projects';
import { BaseStore } from './base-store';
import { modalStore } from '../blocks/modal';
import { ProjectActionRunModalContent, ProjectActionRunModalTitle } from '../blocks/project.action.run.modal';
import { detailsPanelStore } from '../blocks/details-panel';
import { ProjectTargetStreamDetailsModalContent, ProjectTargetStreamDetailsModalTitle } from '../blocks/project.target.stream.details-panel';
import { nextId, processing, saveContent, saveTextAligned, splitFilterTokens } from './utils';
import { alertsStore } from '../blocks/alerts';
import * as _ from 'lodash';
import { FormStore } from './form';
import { ProjectTargetReleaseModalContent, ProjectTargetReleaseModalTitle } from '../blocks/project.target.release.modal';
import { Status } from '../enums/status';
import {getDescriptionValue} from '../blocks/utils';

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
    yield this.projectStore.applyRelease(this.target?.id);
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

export class ProjectTargetReleaseParamsStore extends FormStore<{
  date: Date;
  notes: {
    id: string;
    artifacts: {
      id: string;
      description: string;
    }[];
    assigneeUserId: string;
    description: string;
    flows: string[];
    metadata: {
      streamId?: IProjectTargetStream['id'];
    };
    status: Status;
  }[];
  streams: {
    id: string;
    artifacts: {
      id: string;
      description: string;
    }[];
    assigneeUserId: string;
    description: string;
    flows: string[];
    metadata: {
      streamId?: IProjectTargetStream['id'];
    };
    status: Status;
  }[];
  ops: {
    id: string;
    artifacts: {
      id: string;
      description: string;
    }[];
    assigneeUserId: string;
    description: string;
    flows: string[];
    metadata: {
      streamId?: IProjectTargetStream['id'];
    };
    status: Status;
  }[];
  status: Status;
}> {
  get dto(): IProjectTargetState['release'] {
    const release = this.projectStore.getTargetStoreByTargetId(this.projectTarget.id)?.targetState?.release;

    function updateChangelog(changelog, streamId, artifacts) {
      const existing = changelog.find((change) => change.id === streamId);

      if (!existing?.artifacts) {
        return [ {
          id: streamId,
          artifacts,
          changes: [],
        } ];
      }

      existing.artifacts = existing.artifacts = artifacts;

      return changelog;
    }

    return {
      date: this.state.date,
      sections: [
        ...this.state.notes.map((note) => ({
          id: note.id,
          type: 'note',

          changelog: [],
          description: note.description,
          flows: [],
          metadata: {},
          status: note.status,
        })),
        ...this.state.streams.map((stream) => ({
          id: stream.id,
          type: 'stream',

          changelog: updateChangelog(release.sections?.find((section) => section.id === stream.id)?.changelog, stream.id, stream.artifacts),
          description: stream.description,
          flows: [],
          metadata: {},
          status: stream.status,
        })),
        ...this.state.ops.map((op) => ({
          id: op.id,
          type: 'op',

          changelog: [],
          description: op.description,
          flows: op.flows ?? [],
          metadata: op.metadata ?? {},
          status: op.status,
        })),
      ],
      status: this.state.status,
    };
  }

  get streamsForSelect(): Record<IProjectTargetStream['id'], IProjectTargetStream['title']> {
    const release = this.projectStore.getTargetStoreByTargetId(this.projectTarget.id)?.targetState?.release;

    return release?.sections?.reduce((acc, section) => {
      if (section.type === 'stream') {
        acc[section.id] = this.projectTarget.streams[section.id]?.title ?? section.id;
      }

      return acc;
    }, { null: 'None' });
  }

  protected extra = { streamsForSelect: computed }

  static cloneStreamArtifact(artifact?: Partial<ProjectTargetReleaseParamsStore['state']['streams'][number]['artifacts'][number]>) {
    return {
      id: artifact?.id ?? '',
      description: artifact?.description ?? '',
    };
  }

  static cloneOp(op?: Partial<ProjectTargetReleaseParamsStore['state']['ops'][number]>) {
    return {
      id: op?.id ?? nextId(),
      artifacts: op.artifacts?.map((artifact) => ProjectTargetReleaseParamsStore.cloneStreamArtifact(artifact)) ?? [],
      assigneeUserId: op?.assigneeUserId ?? null,
      description: op?.description ?? '',
      flows: op?.flows ?? [],
      metadata: op?.metadata ?? {},
      status: op?.status ?? null,
    };
  }

  constructor(public projectStore: ProjectStore, public projectTarget: IProjectTarget) {
    const release = projectStore.getTargetStoreByTargetId(projectTarget.id)?.targetState?.release;

    function mapArtifacts(atrifacts) {
      return atrifacts.map((artifact) => ({
        ...artifact,
        description: getDescriptionValue(artifact.description),
      }));
    }

    const notesIv = release.sections?.filter((section) => section.type === 'note').map((section) => ({
      id: section.id ?? nextId(),
      artifacts: section.changelog?.map(({ artifacts }) => mapArtifacts(artifacts ?? []))?.flat() ?? [],
      assigneeUserId: section.assingeeUserId ?? null,
      description: section.description,
      flows: section.flows ?? [],
      metadata: section.metadata ?? {},
      status: section.status ?? null,
    })) ?? [];
    const streamsIv = release.sections?.filter((section) => section.type === 'stream').map((section) => ({
      id: section.id ?? nextId(),
      artifacts: section.changelog?.map(({ artifacts }) => mapArtifacts(artifacts ?? []))?.flat() ?? [],
      assigneeUserId: section.assingeeUserId ?? null,
      description: section.description,
      flows: section.flows ?? [],
      metadata: section.metadata ?? {},
      status: section.status ?? null,
    })) ?? [];
    const opsIv = release.sections?.filter((section) => section.type === 'op').map((section) => ({
      id: section.id ?? nextId(),
      artifacts: section.changelog?.map(({ artifacts }) => mapArtifacts(artifacts ?? []))?.flat() ?? [],
      assigneeUserId: section.assingeeUserId ?? null,
      description: section.description,
      flows: section.flows ?? [],
      metadata: section.metadata ?? {},
      status: section.status ?? null,
    })) ?? [];

    const schema = {
      date: {
        constraints: {},
        type: 'date',
        initialValue: release.date ? new Date(new Date(release.date).getTime() - new Date().getTimezoneOffset() * 60 * 1000).toISOString().substring(0, 16) : null, // FIXME
      },
      status: {
        constraints: {},
        type: 'string',
        initialValue: release.status,
      },
      notes: {
        constraints: { maxLength: 1000 },
        type: {
          id: {
            constraints: {},
            type: 'const',
            initialValue: null,
          },
          artifacts: {
            constraints: {},
            type: {
              id: {
                constraints: { maxLength: 100 },
                type: 'string',
                initialValue: null,
              },
              description: {
                constraints: { maxLength: 100 },
                type: 'string',
                initialValue: null,
              },
            },
            initialValue: [],
          },
          description: {
            constraints: { maxLength: 1000 },
            type: 'string',
            initialValue: null,
          },
          status: {
            constraints: {},
            type: 'string',
            initialValue: null,
          },
        },
        initialValue: notesIv.length ? notesIv : [ { id: nextId(), description: null } ],
      },
      streams: {
        constraints: { maxLength: 1000 },
        type: {
          id: {
            constraints: {},
            type: 'const',
            initialValue: null,
          },
          artifacts: {
            constraints: {},
            type: {
              id: {
                constraints: { maxLength: 100 },
                type: 'string',
                initialValue: null,
              },
              description: {
                constraints: { maxLength: 100 },
                type: 'string',
                initialValue: null,
              },
            },
            initialValue: [],
          },
          description: {
            constraints: { maxLength: 1000 },
            type: 'string',
            initialValue: null,
          },
          status: {
            constraints: {},
            type: 'string',
            initialValue: null,
          },
        },
        initialValue: streamsIv,
      },
      ops: {
        constraints: { maxLength: 1000 },
        type: {
          flows: {
            constraints: {},
            type: 'string',
            initialValue: [],
          },
          artifacts: {
            constraints: {},
            type: {
              id: {
                constraints: { maxLength: 100 },
                type: 'string',
                initialValue: null,
              },
              description: {
                constraints: { maxLength: 100 },
                type: 'string',
                initialValue: null,
              },
            },
            initialValue: [],
          },
          description: {
            constraints: { maxLength: 100 },
            type: 'string',
            initialValue: null,
          },
          status: {
            constraints: {},
            type: 'string',
            initialValue: null,
          },
        },
        initialValue: opsIv,
      },
    } as const;

    super(schema);
  }

  opAdd(op?: Partial<ProjectTargetReleaseParamsStore['state']['ops'][number]>, index?: number) {
    const newOp = ProjectTargetReleaseParamsStore.cloneOp(op);
    const items = this.state.ops;

    if (index != null && index >= 0 && index < this.state.ops.length - 1) {
      items.splice(index + 1, 0, newOp);
    } else {
      items.push(newOp);
    }
  }

  opDel(index: number) {
    const items = this.state.ops;

    items.splice(index, 1);
  }

  opMoveUp(op: ProjectTargetReleaseParamsStore['state']['ops'][number]) {
    const items = this.state.ops;
    const index = items.findIndex((o) => o.id === op.id);

    if (index > 0) {
      const tmp = items[index - 1];
      items[index - 1] = items[index];
      items[index] = tmp;
    }
  }

  opMoveDown(op: ProjectTargetReleaseParamsStore['state']['ops'][number]) {
    const items = this.state.ops;
    const index = items.findIndex((o) => o.id === op.id);

    if (index < items.length - 1) {
      const tmp = items[index + 1];
      items[index + 1] = items[index];
      items[index] = tmp;
    }
  }

  opToggleFlow(op: ProjectTargetReleaseParamsStore['state']['ops'][number], flowId: string) {
    const items = this.state.ops;
    const index = items.findIndex((o) => o.id === op.id);

    if (index >= 0) {
      const flowIndex = items[index].flows.findIndex((flow) => flow === flowId);

      if (flowIndex >= 0) {
        items[index].flows.splice(flowIndex, 1);
      } else {
        items[index].flows.push(flowId);
      }
    }
  }

  streamArtifactAdd(stream: ProjectTargetReleaseParamsStore['state']['streams'][number], artifact?: Partial<ProjectTargetReleaseParamsStore['state']['streams'][number]['artifacts'][number]>, index?: number) {
    const newArtifact = ProjectTargetReleaseParamsStore.cloneStreamArtifact(artifact);
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];

    if (index != null && index >= 0 && index < items.length - 1) {
      items.splice(index + 1, 0, newArtifact);
    } else {
      items.push(newArtifact);
    }
  }

  streamArtifactDel(stream: ProjectTargetReleaseParamsStore['state']['streams'][number], index: number) {
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];

    items.splice(index, 1);
  }

  streamArtifactMoveUp(stream: ProjectTargetReleaseParamsStore['state']['streams'][number], index: number) {
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];
    // const index = items.findIndex((a) => a.id === artifact.id);

    if (index > 0) {
      const tmp = items[index - 1];
      items[index - 1] = items[index];
      items[index] = tmp;
    }
  }

  streamArtifactMoveDown(stream: ProjectTargetReleaseParamsStore['state']['streams'][number], index: number) {
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];
    // const index = items.findIndex((a) => a.id === artifact.id);

    if (index < items.length - 1) {
      const tmp = items[index + 1];
      items[index + 1] = items[index];
      items[index] = tmp;
    }
  }
}

export class ProjectFlowParamsStore extends FormStore {
  projectFlow: IProjectFlow;
  projectTarget: IProjectTarget;
  projectTargetStreams: { id: IProjectTargetStream['id']; title: IProjectTargetStream['title']; isSelected: boolean }[];

  get streamIds() {
    return this.projectTargetStreams.filter((stream) => stream.isSelected).map((stream) => stream.id);
  }

  constructor(
    public projectStore: ProjectStore,
    public flowId?: IProjectFlow['id'],
    public targetId?: string,
    public selectedStreamIds?: IProjectTargetStream['id'][],
  ) {
    const projectFlow = flowId ? projectStore.project?.flows[flowId] : Object
      .values(projectStore.project?.flows)
      .find((flow) => flow.targets.includes(targetId));

    super(projectFlow.params ?? {});

    this.projectFlow = projectFlow;
    this.projectTarget = projectStore.getTargetByTargetId(targetId),
    this.projectTargetStreams = Object.values(this.projectTarget.streams)
      .filter((stream) => !selectedStreamIds || selectedStreamIds?.includes(stream.id))
      .map((stream) => ({ id: stream.id, title: stream.title, isSelected: true }));
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

    const projectFlowParamsStore = new ProjectFlowParamsStore(
      this,
      flowId,
      targetId,
      selectedStreamIds,
    );
    const action = yield modalStore.show({
      content: ProjectActionRunModalContent,
      props: {
        externalStore: projectFlowParamsStore,
      },
      onBeforeSelect: (action) => action === 'ok' ? projectFlowParamsStore.validateAll() : true,
      title: ProjectActionRunModalTitle,
      withClose: true,
    });

    switch (action) {
    case 'cancel':
      break;
    case 'ok':
      yield this.projectsStore.service.flowRun(
        this.project.id,
        projectFlowParamsStore.flowId,
        { [targetId]: projectFlowParamsStore.streamIds },
        projectFlowParamsStore.state,
      );
      yield this.fetchState();

      break;
    }
  }

  @flow @processing
  *applyRelease(targetId: string) {
    const projectTargetReleaseParamsStore = new ProjectTargetReleaseParamsStore(
      this,
      this.getTargetByTargetId(targetId),
    );

    const action = yield modalStore.show({
      content: ProjectTargetReleaseModalContent,
      maxHeight: true,
      props: {
        projectTargetReleaseParamsStore,
        projectTargetStore: this.getTargetStoreByTargetId(targetId),
      },
      onBeforeSelect: (action) => action === 'ok' ? projectTargetReleaseParamsStore.validateAll() : true,
      title: ProjectTargetReleaseModalTitle,
      withClose: true,
    });

    switch (action) {
    case 'cancel':
      break;
    case 'ok':
      const updated = yield this.projectsStore.service.releaseUpdate(
        this.project.id,
        targetId,
        projectTargetReleaseParamsStore.dto,
      );
      this.getTargetStoreByTargetId(targetId).targetState.release = updated;

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
