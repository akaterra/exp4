import { Service } from 'typedi';
import { IProjectFlowActionStepDef, IProjectFlowDef, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { IStepService } from './step.service';
import { ProjectsService } from '../projects.service';
import { Autowired, iter } from '../utils';
import { EntityService } from '../entities.service';
import { makeDirty } from './utils';

@Service()
export class VersionReleaseStepService extends EntityService implements IStepService {
  static readonly type = 'version:release';

  @Autowired() protected projectsService: ProjectsService;

  async run(
    flow: IProjectFlowDef,
    // action: IProjectFlowActionDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<IProjectTargetDef['id'], [ IProjectTargetStreamDef['id'], ...IProjectTargetStreamDef['id'][] ] | true>,
    params?: Record<string, any>,
  ): Promise<void> {
    const project = this.projectsService.get(flow.ref.projectId);

    for (const [ ,tId ] of iter(targetsStreams ? Object.keys(targetsStreams) : step.targets)) {
      const target = project.getTargetByTargetId(tId);

      await project.getEnvVersioningByTarget(target).release(target, params);

      makeDirty(target);
    }
  }
}
