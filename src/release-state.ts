import { IProjectTargetDef, IProjectTargetStreamDef } from './project';
import {StreamState} from './stream-state';
import * as _ from 'lodash';

export interface IReleaseStateSection {
  id: string;
  type: string;

  description?: string;

  changelog: {
    streamId?: IProjectTargetStreamDef['id'];
    notes?: { id: string; text: string }[];

    artifacts?: Array<Pick<
      StreamState['history']['artifact'][number],
      'id' | 'type' | 'description' | 'link' | 'status' | 'time'
    >>;
    changes?: Pick<
      StreamState['history']['change'][number],
      'id' | 'type' | 'description' | 'link' | 'status' | 'time'
    >[];
  }[];
  priority?: number;
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

  getSection(id: string): IReleaseStateSection | null {
    return this.sections.find((s) => s.id === id) ?? null;
  }

  setSection(section: Partial<IReleaseStateSection>, onlyExisting?: boolean): this {
    const existingSection = this.getSection(section.id);

    if (onlyExisting && !existingSection) {
      return this;
    }

    const releaseSection = {
      ...section,
      changelog: section.changelog ?? [],
    } as IReleaseStateSection;

    if (this.schema) {
      const schemaSection = this.schema.sections?.find((s) => s.id === section.id || s.type === section.type);

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
      if (section.priority === undefined) {
        section.priority = Infinity;
      }

      const index = this.sections.findLastIndex((s) => s.priority <= section.priority);

      if (index === -1) {
        this.sections.push({
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
    const existingSection = this.getSection(`stream:${streamId}`);

    if (onlyExisting && !existingSection) {
      return this;
    }

    const existingSectionChangelog = existingSection?.changelog.find((c) => c.streamId === streamId);

    return this.setSection({
      id: `stream:${streamId}`,
      type: 'stream',

      changelog: [
        {
          streamId,
          artifacts: artifacts
            ? _.unionBy(artifacts, existingSectionChangelog?.artifacts ?? [], 'id') ?? []
            : existingSectionChangelog?.artifacts ?? [],
          notes: notes
            ? _.unionBy(notes, existingSectionChangelog?.notes ?? [], 'id') ?? []
            : existingSectionChangelog?.notes ?? [],
        },
      ],
      priority: 1,
    });
  }

  toJSON() {
    return {
      ...this,
      schema: undefined,
    };
  }
}
