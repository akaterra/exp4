import { IService } from './entities.service';
import { Status } from './enums/status';
import { IReleaseConfig } from './extensions/release';
import { IProjectDef, IProjectFlowDef, IProjectTargetStreamDef } from './project';
import { StreamState } from './stream-state';
import * as _ from 'lodash';

export interface IReleaseStateSection {
  id: string;
  type: string;

  description?: string;

  assigneeUserId?: string;
  changelog: {
    id?: IProjectDef['id'];
    notes?: { id: string; text: string }[];

    artifacts?: Array<Pick<
      StreamState['history']['artifact'][number],
      'id' | 'type' | 'description' | 'link' | 'metadata' | 'status' | 'time'
    > & { isSystem?: boolean }>;
    changes?: Array<Pick<
      StreamState['history']['change'][number],
      'id' | 'type' | 'description' | 'link' | 'metadata' | 'status' | 'time'
    > & { isSystem?: boolean }>;
  }[];
  flows?: IProjectFlowDef['id'][];
  level?: number;
  metadata?: Record<string, unknown>;
  status?: string;
}

export class ReleaseState<
  Metadata extends Record<string, unknown> = Record<string, unknown>,
> implements IService {
  id: string;
  type: string;
  
  readonly assertType = 'release';
  
  config: IReleaseConfig;
  
  date?: Date;
  metadata: Metadata;
  sections: IReleaseStateSection[] = [];
  status: Status;
  statusUpdateAt?: Date;

  isDirty: boolean = false;
  ver: number = 0;

  isSyncing?: boolean;

  get state() {
    return {
      date: this.date,
      metadata: this.metadata,
      sections: this.sections,
      status: this.status,
      statusUpdateAt: this.statusUpdateAt,
      ver: this.ver,
    };
  }

  constructor(props: Partial<ReleaseState>) {
    this.id = props.id ?? null;
    this.type = props.type ?? null;
    this.config = props.config ?? null;
    this.date = props.date ?? null;
    this.metadata = (props.metadata ?? {}) as Metadata;
    this.sections = props.sections ?? [];
    this.status = props.status ?? Status.PENDING;
    this.statusUpdateAt = props.statusUpdateAt ?? null;
    this.isDirty = props.isDirty ?? false;
    this.ver = props.ver ?? 0;
  }

  getSection(id: string, type: string): IReleaseStateSection | null {
    return this.sections.find((s) => s.id === id && s.type === type) ?? null;
  }

  setSection(section: Partial<IReleaseStateSection>, onlyExisting?: boolean): this {
    const existingSection = this.getSection(section.id, section.type);

    if (onlyExisting && !existingSection) {
      return this;
    }

    const releaseSection = {
      ...section,
      changelog: section.changelog ?? [],
    } as IReleaseStateSection;

    if (this.config) {
      const schemaSection = this.config.sections?.find((s) => s.id ? s.id === section.id : s.type === section.type);

      if (schemaSection?.changelog?.artifacts?.length) {
        for (const changelog of releaseSection.changelog) {
          if (!changelog.artifacts) {
            continue;
          }

          changelog.artifacts = changelog.artifacts
            .filter((artifact) => schemaSection.changelog.artifacts.includes(artifact.id) || schemaSection.changelog.isSystem !== artifact.isSystem)
            .map((artifact) => ({
              id: artifact.id,
              type: artifact.type,

              description: artifact.description,
              link: artifact.link,
              metadata: artifact.metadata,
              status: artifact.status,
              time: artifact.time,
            }));
        }
      }

      if (schemaSection?.changelog?.changes?.length) {
        for (const changelog of releaseSection.changelog) {
          if (!changelog.changes) {
            continue;
          }

          changelog.changes = changelog.changes
            .filter((change) => schemaSection.changelog.changes.includes(change.id) || schemaSection.changelog.isSystem !== change.isSystem)
            .map((change) => ({
              id: change.id,
              type: change.type,

              description: change.description,
              link: change.link,
              metadata: change.metadata,
              status: change.status,
              time: change.time,
            }));
        }
      }
    }

    if (existingSection) {
      Object.assign(existingSection, section);
    } else {
      if (section.level === undefined) {
        section.level = Infinity;
      }

      const index = this.sections.findLastIndex((s) => s.level <= section.level);

      if (index === -1) {
        this.sections.splice(this.sections.findLastIndex((s) => s.level === section.level) + 1, 0, {
          ...section,
          changelog: section.changelog ?? [],
        } as IReleaseStateSection);
      } else {
        this.sections.splice(index + 1, 0, {
          ...section,
          changelog: section.changelog ?? [],
        } as IReleaseStateSection);
      }
    }

    return this;
  }

  setSectionByStreamId(
    streamId: IProjectTargetStreamDef['id'],
    artifacts?: IReleaseStateSection['changelog'][0]['artifacts'],
    changes?: IReleaseStateSection['changelog'][0]['changes'],
    notes?: IReleaseStateSection['changelog'][0]['notes'],
    isSystem?: boolean,
    onlyExisting?: boolean,
  ): this {
    const existingSection = this.getSection(streamId, 'stream');

    if (onlyExisting && !existingSection) {
      return this;
    }

    const existingSectionChangelog = existingSection?.changelog.find((c) => c.id === streamId);

    return this.setSection({
      id: streamId,
      type: 'stream',

      changelog: [
        {
          id: streamId,
          artifacts: artifacts
            ? _.unionBy(artifacts.map((e) => ({ ...e, isSystem })), existingSectionChangelog?.artifacts ?? [], 'id') ?? []
            : existingSectionChangelog?.artifacts ?? [],
          changes: changes
            ? _.unionBy(changes.map((e) => ({ ...e, isSystem })), existingSectionChangelog?.changes ?? [], 'id') ?? []
            : existingSectionChangelog?.changes ?? [],
          notes: notes
            ? _.unionBy(notes, existingSectionChangelog?.notes ?? [], 'id') ?? []
            : existingSectionChangelog?.notes ?? [],
        },
      ],
      level: 1,
    });
  }

  setStatus(status: Status): this {
    if (!status || status === this.status) {
      return this;
    }

    this.status = status;
    this.statusUpdateAt = new Date();

    return this;
  }

  toJSON(ver?: number) {
    return {
      id: this.id,
      type: this.type,

      date: this.date,
      metadata: this.metadata,
      sections: this.sections,
      status: this.status,
      statusUpdateAt: this.statusUpdateAt,
      ver: ver ?? this.ver,
    };
  }
}
