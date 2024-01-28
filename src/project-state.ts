import { Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { ProjectsService } from './projects.service';
import { StreamState } from './stream';
import { Autowired } from './utils';
import { TargetState } from './target';

@Service()
export class ProjectState {
  syncQueue: [ IProjectTargetDef['id'], IProjectTargetStreamDef['id'][], Record<string, boolean>? ][] = [];
  updatedAt: Date = null;

  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;

  get isSyncing(): boolean {
    return Object.values(this.targets).some((target) => target.isSyncing);
  }

  constructor(
    public id: IProjectDef['id'] = null,
    public targets: Record<IProjectTargetDef['id'], TargetState> = {},
  ) {
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

  setTarget(targetId: IProjectTargetDef['id'], target: Partial<TargetState>) {
    const oldTarget = this.targets[targetId];

    if (oldTarget) {
      for (const key of Object.keys(target)) {
        oldTarget[key] = target[key];
      }
    } else {
      this.targets[targetId] = target instanceof TargetState
        ? target
        : new TargetState(target);
    }

    return this;
  }

  setTargetStream(targetId: IProjectTargetDef['id'], stream: Partial<StreamState>) {
    const oldTargetStream = this.ensureTarget(targetId).streams[stream.id];

    if (oldTargetStream) {
      for (const key of Object.keys(stream)) {
        oldTargetStream[key] = stream[key];
      }
    } else {
      this.targets[targetId].streams[stream.id] = stream instanceof StreamState
        ? stream
        : new StreamState(stream);
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
      targets: this.targets,
      updatedAt: this.updatedAt,
    };
  }

  private ensureTarget(targetId): TargetState {
    if (!this.targets[targetId]) {
      this.setTarget(targetId, { id: targetId });
    }

    return this.targets[targetId];
  }

  private ensureTargetStream(targetId, streamId): StreamState {
    if (!this.ensureTarget(targetId).streams[targetId]) {
      this.setTargetStream(targetId, { id: streamId });
    }

    return this.targets[targetId].streams[streamId];
  }
}
