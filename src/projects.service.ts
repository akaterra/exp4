import { Inject, Service } from 'typedi';
import { IProjectTargetDef, IProjectTargetStreamDef, Project } from './project';
import { StreamsService } from './streams.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';
import { IStream } from './stream';
import { ITarget } from './target';
import { iter } from './utils';
import { ActionsService } from './actions.service';
import { EntitiesService } from './entities.service';

@Service()
export class ProjectsService extends EntitiesService<Project> {
  @Inject(() => ActionsService) protected actionsService: ActionsService;
  @Inject(() => StreamsService) protected streamsService: StreamsService;
  @Inject(() => TargetsService) protected targetsService: TargetsService;

  get domain() {
    return 'Project';
  }

  list() {
    return this.entities;
  }

  async flowActionRun(projectId: string, flowId: string, actionId: string | string[]) {
    const flow = this.get(projectId).getFlow(flowId);

    for (const [ , aId ] of iter(actionId)) {
      for (const action of flow.actions[aId].steps) {
        await this.actionsService.get(action.type).run(action);
      }
    }

    return true;
  }

  streamGetState(stream: IProjectTargetStreamDef): Promise<IStream>;

  streamGetState(projectId: string, targetId: string, streamId: string): Promise<IStream>;

  async streamGetState(mixed: string | IProjectTargetStreamDef, targetId?: string, streamId?: string) {
    const stream = typeof mixed === 'string'
      ? await this.streamsService.getState(this.get(mixed).getTargetStreamByTargetIdAndStreamId(targetId, streamId))
      : await this.streamsService.getState(mixed);

    return stream;
  }

  async streamGetStateAll(projectId: string, targetId?: string | string[]) {
    const targets: Record<string, Record<string, IStream>> = {};
    const project = this.get(projectId);

    for (const [ ,tId ] of iter(targetId ?? Object.keys(project.targets))) {
      targets[tId] = {};

      for (const [ sId, stream ] of Object.entries(project.getTargetByTargetId(tId).streams)) {
        targets[tId][sId] = await this.streamGetState(stream);
      }
    }

    return targets;
  }

  targetGetState(stream: IProjectTargetDef): Promise<ITarget>;

  targetGetState(projectId: string, targetId: string): Promise<ITarget>;

  async targetGetState(mixed: string | IProjectTargetDef, targetId?: string) {
    const target = typeof mixed === 'string'
      ? this.targetsService.getState(this.get(mixed).getTargetByTargetId(targetId))
      : this.targetsService.getState(mixed);

    return target;
  }
}
