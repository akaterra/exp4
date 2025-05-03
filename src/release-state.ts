import { IProjectDef, IProjectFlow, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { StreamState } from './stream-state';
import * as _ from 'lodash';

export interface IReleaseStateSection {
  id: string;
  type: string;

  description?: string;

  changelog: {
    id?: IProjectDef['id'];
    notes?: { id: string; text: string }[];

    artifacts?: Pick<
      StreamState['history']['artifact'][number],
      'id' | 'type' | 'description' | 'link' | 'status' | 'time'
    >[];
    changes?: Pick<
      StreamState['history']['change'][number],
      'id' | 'type' | 'description' | 'link' | 'status' | 'time'
    >[];
  }[];
  flows?: IProjectFlowDef['id'][];
  level?: number;
}

export class ReleaseState {
  id: string;
  type: string;

  metadata: Record<string, any>;
  sections: IReleaseStateSection[] = [];
  schema: IProjectTargetDef['release'];

  constructor(props: Partial<ReleaseState>) {
    if (!props.metadata) {
      props.metadata = {};
    }

    if (!props.sections) {
      props.sections = [];
    }

    Reflect.setPrototypeOf(props, ReleaseState.prototype);

    return props as ReleaseState;
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

    if (this.schema) {
      const schemaSection = this.schema.sections?.find((s) => section.id ? s.id === section.id : s.type === section.type);

      if (schemaSection?.changelog?.artifacts) {
        for (const schemaArtifact of schemaSection.changelog.artifacts) {
          for (const changelog of releaseSection.changelog) {
            if (!changelog.artifacts) {
              continue;
            }

            changelog.artifacts = changelog.artifacts.filter((artifact) => artifact.id === schemaArtifact).map((artifact) => ({
              id: artifact.id,
              type: artifact.type,

              description: artifact.description,
              link: artifact.link,
              status: artifact.status,
              time: artifact.time,
            }));
          }
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
    notes?: IReleaseStateSection['changelog'][0]['notes'],
    onlyExisting?: boolean,
  ): this {
    const existingSection = this.getSection(streamId, 'stream');

    if (onlyExisting && !existingSection) {
      return this;
    }

    const existingSectionChangelog = existingSection?.changelog.find((c) => c.id === streamId);

    return this.setSection({
      id: `stream:${streamId}`,
      type: 'stream',

      changelog: [
        {
          id: streamId,
          artifacts: artifacts
            ? _.unionBy(artifacts, existingSectionChangelog?.artifacts ?? [], 'id') ?? []
            : existingSectionChangelog?.artifacts ?? [],
          notes: notes
            ? _.unionBy(notes, existingSectionChangelog?.notes ?? [], 'id') ?? []
            : existingSectionChangelog?.notes ?? [],
        },
      ],
      level: 1,
    });
  }

  update(release: Partial<ReleaseState>) {
    if (release.metadata) {
      this.metadata = Object.assign(this.metadata, release.metadata);
    }

    if (release.schema) {
      this.schema = release.schema;
    }

    if (release.sections) {
      release.sections.forEach((section) => this.setSection(section));
    }

    return this;
  }

  toJSON() {
    return {
      ...this,
      schema: undefined,
    };
  }
}
