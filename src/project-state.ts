import { Service } from 'typedi';
import { IProjectDef, IProjectTargetDef, IProjectTargetStreamDef } from './project';
import { ProjectsService } from './projects.service';
import { StreamState } from './stream';
import { Autowired } from './utils';

@Service()
export class ProjectState {
  updatedAt: Date = null;

  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;

  constructor(
    public id: IProjectDef['id'] = null,
    public targets: Record<string, {
      id: IProjectTargetDef['id'];
      streams: Record<string, StreamState>;
      version: string;
    }> = {},
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

  setTarget(targetId: IProjectTargetDef['id'], config: {
    streams?: Record<string, StreamState>,
    version?: string,
  }) {
    const oldTarget = this.targets[targetId];
    this.targets[targetId] = {
      id: targetId,
      streams: config.streams ?? oldTarget?.streams ?? {},
      version: config.version ?? oldTarget?.version ?? null,
    };
    this.updatedAt = new Date();

    return this;
  }

  setTargetStream(targetId: IProjectTargetDef['id'], stream: Partial<StreamState>) {
    if (!this.targets[targetId]) {
      this.setTarget(targetId, {});
    }

    const oldStream = this.targets[targetId].streams[stream.id];

    if (oldStream) {
      for (const key of Object.keys(oldStream)) {
        if (!stream.hasOwnProperty(key)) {
          stream[key] = oldStream[key];
        }
      }
    }

    this.targets[targetId].streams[stream.id] = stream as StreamState;

    return this;
  }

  toJSON() {
    return {
      id: this.id,
      targets: this.targets,
      updatedAt: this.updatedAt,
    };
  }
}
