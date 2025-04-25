import { IProjectTargetStreamDef } from '../project';
import { ReleaseState } from '../release';
import { StreamState } from '../stream';
import { Service } from 'typedi';
import { IProjectTargetDef } from '../project';
import { AwaitedCache } from '../cache';
import { ProjectsService } from '../projects.service';
import { Autowired } from '../utils';

export class TargetState {
  id: string;
  type: string;

  release?: ReleaseState;
  streams?: Record<IProjectTargetStreamDef['id'], StreamState>;
  version?: string;

  get isSyncing(): boolean {
    return Object.values(this.streams).some((stream) => stream.isSyncing);
  }

  constructor(props: Partial<TargetState>) {
    Reflect.setPrototypeOf(props, TargetState.prototype);

    props.streams = props.streams ?? {};

    return props as TargetState;
  }
}

@Service()
export class TargetHolderService {
  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;
  protected cache = new AwaitedCache<TargetState>();

  get domain() {
    return 'Target';
  }

  async getState(target: IProjectTargetDef) {
    const key = `${target.ref.projectId}:${target.id}`;
    const entity = await this.cache.get(key) ?? new TargetState({ id: target.id, type: null });

    if (entity) {
      entity.version = await this.getVersioningsService(target).getCurrent(
        this.projectsService.get(target.ref.projectId).getTargetByTargetId(target.id),
      );
    }

    this.cache.set(key, entity);

    return entity;
  }

  private getVersioningsService(target: IProjectTargetDef) {
    return this.projectsService
      .get(target.ref?.projectId)
      .getEnvVersioningByVersioningId(target.versioning);
  }
}
