import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectTarget, IProjectTargetStream } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class RunActionStepService extends EntityService implements IStepService {
  @Autowired() protected projectsService: ProjectsService;

  get type() {
    return 'runAction';
  }

  async run(
    action: IProjectFlowActionDef,
    targetsStreams?: Record<IProjectTarget['id'], [ IProjectTargetStream['id'], ...IProjectTargetStream['id'][] ] | true>,
  ): Promise<void> {
  }
}
