import { IProjectTargetStreamDef } from './project';
import {StreamState} from './stream-state';
import * as _ from 'lodash';

export interface IReleaseStateSection {
  id: string;
  type: string;

  description?: string;

  changelog: {
    streamId: IProjectTargetStreamDef['id'];
    artifacts?: StreamState['history']['artifact'];
    notes?: { id: string; text: string }[];
  }[];
  priority?: number;
}

export class ReleaseState {
  id: string;
  type: string;

  sections: IReleaseStateSection[] = [];

  constructor(props: Partial<ReleaseState>) {
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
}
