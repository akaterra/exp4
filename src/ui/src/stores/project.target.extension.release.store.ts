import { getDescriptionValue } from '../blocks/utils';
import { Status } from '../enums/status';
import { IProjectTarget, IProjectTargetStream } from './dto/project';
import { IProjectTargetState } from './dto/project-state';
import { FormStore } from './form';
import { ProjectStore, ProjectTargetStore } from './project';
import { nextId } from './utils';

export class ProjectTargetExtensionReleaseStore extends FormStore<{
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
  projectTarget: IProjectTarget;
  projectTargetStore: ProjectTargetStore;

  get dto(): IProjectTargetState['extensions']['release'] {
    const release = this.projectStore.getTargetStoreByTargetId(this.projectTarget.id)?.targetState?.extensions?.release;

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
    const release = this.projectStore.getTargetStoreByTargetId(this.projectTarget.id)?.targetState?.extensions?.release;

    return release?.sections?.reduce((acc, section) => {
      if (section.type === 'stream') {
        acc[section.id] = this.projectTarget.streams[section.id]?.title ?? section.id;
      }

      return acc;
    }, { null: 'None' });
  }

  protected extra = { streamsForSelect: true }

  static cloneStreamArtifact(artifact?: Partial<ProjectTargetExtensionReleaseStore['state']['streams'][number]['artifacts'][number]>) {
    return {
      id: artifact?.id ?? '',
      description: artifact?.description ?? '',
    };
  }

  static cloneOp(op?: Partial<ProjectTargetExtensionReleaseStore['state']['ops'][number]>) {
    return {
      id: op?.id ?? nextId(),
      artifacts: op?.artifacts?.map((artifact) => ProjectTargetExtensionReleaseStore.cloneStreamArtifact(artifact)) ?? [],
      assigneeUserId: op?.assigneeUserId ?? null,
      description: op?.description ?? '',
      flows: op?.flows ?? [],
      metadata: op?.metadata ?? {},
      status: op?.status ?? null,
    };
  }

  constructor(public projectStore: ProjectStore, public targetId: IProjectTarget['id']) {
    const projectTarget = projectStore.getTargetByTargetId(targetId);
    const projectTargetStore = projectStore.getTargetStoreByTargetId(targetId);
    const release = projectTargetStore?.targetState?.extensions?.release;

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

    this.projectTarget = projectTarget;
    this.projectTargetStore = projectTargetStore;
  }

  opAdd(op?: Partial<ProjectTargetExtensionReleaseStore['state']['ops'][number]>, index?: number) {
    const newOp = ProjectTargetExtensionReleaseStore.cloneOp(op);
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

  opMoveUp(op: ProjectTargetExtensionReleaseStore['state']['ops'][number]) {
    const items = this.state.ops;
    const index = items.findIndex((o) => o.id === op.id);

    if (index > 0) {
      const tmp = items[index - 1];
      items[index - 1] = items[index];
      items[index] = tmp;
    }
  }

  opMoveDown(op: ProjectTargetExtensionReleaseStore['state']['ops'][number]) {
    const items = this.state.ops;
    const index = items.findIndex((o) => o.id === op.id);

    if (index < items.length - 1) {
      const tmp = items[index + 1];
      items[index + 1] = items[index];
      items[index] = tmp;
    }
  }

  opToggleFlow(op: ProjectTargetExtensionReleaseStore['state']['ops'][number], flowId: string) {
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

  streamArtifactAdd(stream: ProjectTargetExtensionReleaseStore['state']['streams'][number], artifact?: Partial<ProjectTargetExtensionReleaseStore['state']['streams'][number]['artifacts'][number]>, index?: number) {
    const newArtifact = ProjectTargetExtensionReleaseStore.cloneStreamArtifact(artifact);
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];

    if (index != null && index >= 0 && index < items.length - 1) {
      items.splice(index + 1, 0, newArtifact);
    } else {
      items.push(newArtifact);
    }
  }

  streamArtifactDel(stream: ProjectTargetExtensionReleaseStore['state']['streams'][number], index: number) {
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];

    items.splice(index, 1);
  }

  streamArtifactMoveUp(stream: ProjectTargetExtensionReleaseStore['state']['streams'][number], index: number) {
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];
    // const index = items.findIndex((a) => a.id === artifact.id);

    if (index > 0) {
      const tmp = items[index - 1];
      items[index - 1] = items[index];
      items[index] = tmp;
    }
  }

  streamArtifactMoveDown(stream: ProjectTargetExtensionReleaseStore['state']['streams'][number], index: number) {
    const items = this.state.streams.find((s) => s.id === stream.id)?.artifacts ?? [];
    // const index = items.findIndex((a) => a.id === artifact.id);

    if (index < items.length - 1) {
      const tmp = items[index + 1];
      items[index + 1] = items[index];
      items[index] = tmp;
    }
  }
}
