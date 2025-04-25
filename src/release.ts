import { IProjectTargetStreamDef } from './project';

export interface IReleaseStateSection {
  id: string;
  type: string;

  description?: string;

  changes: {
    streamId: IProjectTargetStreamDef['id'];
    artifacts?: { id: string; type: string }[];
    notes?: string[];
  }[];
  priority?: number;
}

export class ReleaseState {
  id: string;
  type: string;

  sections: IReleaseStateSection[] = [];

  constructor(props: Partial<ReleaseState>) {
    Reflect.setPrototypeOf(props, ReleaseState.prototype);

    return props as ReleaseState;
  }

  getSection(id: string): IReleaseStateSection | null {
    return this.sections.find((s) => s.id === id) ?? null;
  }

  setSection(section: Partial<IReleaseStateSection>): this {
    const existingSection = this.getSection(section.id);

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
          changes: section.changes ?? [],
        } as IReleaseStateSection);
      } else {
        this.sections.splice(index + 1, 0, {
          ...section,
          changes: section.changes ?? [],
        } as IReleaseStateSection);
      }
    }

    return this;
  }

  setSectionByStreamId(
    streamId: IProjectTargetStreamDef['id'],
    artifacts?: IReleaseStateSection['changes'][0]['artifacts'],
    notes?: IReleaseStateSection['changes'][0]['notes'],
  ): this {
    const existingSectionChange = this.getSection(`stream:${streamId}`)?.changes.find((c) => c.streamId === streamId);

    return this.setSection({
      id: `stream:${streamId}`,
      changes: [
        {
          streamId,
          artifacts: artifacts ?? existingSectionChange?.artifacts ?? [],
          notes: notes ?? existingSectionChange?.notes ?? [],
        },
      ],
      priority: 1,
    });
  }
}
