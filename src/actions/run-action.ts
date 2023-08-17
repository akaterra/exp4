import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { StreamsService } from '../streams.service';
import { EntityService } from '../entities.service';

@Service()
export class RunActionActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;
  @Inject() protected streamsService: StreamsService;

  get type() {
    return 'runAction';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
  }
}
