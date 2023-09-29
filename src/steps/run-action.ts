import { Service } from 'typedi';
import { IProjectFlowActionDef, IProjectFlowActionStepDef, IProjectFlowDef, IProjectTarget, IProjectTargetDef, IProjectTargetStream, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class RunActionStepService extends EntityService implements IStepService {
  static readonly type = 'runAction';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    action: IProjectFlowActionDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
  ): Promise<void> {
  }
}
