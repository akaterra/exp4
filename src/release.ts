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
}

export class ReleaseState {
  id: string;
  type: string;

  sections: IReleaseStateSection[] = [];

  constructor(props: Partial<ReleaseState>) {
    Reflect.setPrototypeOf(props, ReleaseState.prototype);

    return props as ReleaseState;
  }

  setSection(section: Partial<IReleaseStateSection>): this {
    const existingSection = this.sections.find((s) => s.id === section.id);

    if (existingSection) {
      Object.assign(existingSection, section);
    } else {
      this.sections.push({
        ...section,
        changes: section.changes ?? [],
      } as IReleaseStateSection);
    }

    return this;
  }

  setSectionByStreamId(
    streamId: IProjectTargetStreamDef['id'],
    artifacts?: IReleaseStateSection['changes'][0]['artifacts'],
    notes?: IReleaseStateSection['changes'][0]['notes'],
  ): this {
    this.setSection({
      id: streamId,
      changes: [
        {
          streamId,
          artifacts,
          notes,
        },
      ],
    });

    return this;
  }
}
