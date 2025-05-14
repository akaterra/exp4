import { Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { ProjectsService } from './projects.service';
import { StreamState } from './stream-state';
import { Autowired } from './utils';
import { TargetState } from './target-state';

@Service()
export class ProjectState {
  syncQueue: [ IProjectTargetDef['id'], IProjectTargetStreamDef['id'][], Record<string, boolean>? ][] = [];
  targetsStates: Record<IProjectTargetDef['id'], TargetState> = {};
  updatedAt: Date = null;

  isDirty: boolean = false;
  ver: number = 0;

  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;

  get isSyncing(): boolean {
    return Object.values(this.targetsStates).some((target) => target.isSyncing);
  }

  constructor(public id: IProjectDef['id'] = null) {
  }

  getDirtyTargetIds(): IProjectTargetDef['id'][] {
    const project = this.projectsService.get(this.id);
    const ids: IProjectTargetDef['id'][] = [];

    for (const target of Object.values(project.targets)) {
      if (Object.values(target.streams).some((stream) => stream.isDirty)) {
        ids.push(target.id);
      }
    }

    return ids;
  }

  getDirtyTargetStreamIds(targetId: IProjectTargetDef['id']): IProjectTargetStreamDef['id'][] {
    const project = this.projectsService.get(this.id);
    const ids: IProjectTargetStreamDef['id'][] = [];

    for (const stream of Object.values(project.targets[targetId]?.streams)) {
      if (stream.isDirty) {
        ids.push(stream.id);
      }
    }

    return ids;
  }

  getTargetState(mixed: IProjectTargetDef['id'] | IProjectTargetDef | TargetState, unsafe?: boolean): TargetState {
    const targetState = this.targetsStates[typeof mixed === 'string' ? mixed : mixed.id] ?? null;

    if (!targetState && !unsafe) {
      throw new Error(`Target state not found for target "${typeof mixed === 'string' ? mixed : mixed.id}"`);
    }

    return targetState;
  }

  setTargetState(targetId: IProjectTargetDef['id'], targetState: Partial<TargetState>) {
    const oldTarget = this.targetsStates[targetId];

    if (oldTarget) {
      for (const key of Object.keys(targetState)) {
        oldTarget[key] = targetState[key];
      }
    } else {
      this.targetsStates[targetId] = targetState instanceof TargetState
        ? targetState
        : new TargetState(targetState);
    }

    return this;
  }

  getTargetStreamState(targetId: IProjectTargetDef['id'], streamId: IProjectTargetStreamDef['id']): StreamState {
    const streamState = this.targetsStates[targetId]?.streams[streamId] ?? null;

    if (!streamState) {
      throw new Error(`Stream state not found for target "${targetId}", stream "${streamId}"`);
    }

    return streamState;
  }

  setTargetStreamState(targetId: IProjectTargetDef['id'], streamState: Partial<StreamState>) {
    const oldTargetStream = this.ensureTarget(targetId).streams[streamState.id];

    if (oldTargetStream) {
      Object.assign(oldTargetStream, streamState);
    } else {
      this.targetsStates[targetId].streams[streamState.id] = streamState instanceof StreamState
        ? streamState
        : new StreamState(streamState);
    }

    return this;
  }

  addTargetSync(targetId: IProjectTargetDef['id'], streamIds?: IProjectTargetStreamDef['id'][], scopes?) {
    const project = this.projectsService.get(this.id);
    const projectTarget = project.targets[targetId];

    if (!streamIds) {
      streamIds = Object.keys(projectTarget.streams);
    }

    this.syncQueue.push([ targetId, streamIds, scopes ]);

    for (const streamId of streamIds) {
      this.ensureTargetStream(targetId, streamId).isSyncing = true;
    }
  }

  popTargetSync(count: number = 1) {
    return this.syncQueue.splice(0, count);
  }

  toJSON() {
    return {
      id: this.id,
      targets: this.targetsStates,
      updatedAt: this.updatedAt,
    };
  }

  private ensureTarget(targetId): TargetState {
    if (!this.targetsStates[targetId]) {
      this.setTargetState(targetId, { id: targetId });
    }

    return this.targetsStates[targetId];
  }

  private ensureTargetStream(targetId, streamId): StreamState {
    if (!this.ensureTarget(targetId).streams[targetId]) {
      this.setTargetStreamState(targetId, { id: streamId });
    }

    return this.targetsStates[targetId].streams[streamId];
  }
}
