import { Inject, Service } from 'typedi';
import { IProjectFlowActionDef } from '../project';
import { IActionService } from './action.service';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { VersioningsService } from '../versionings.service';

@Service()
export class VersionOverrideActionService extends EntityService implements IActionService {
  @Inject() protected projectsService: ProjectsService;
  @Inject() protected versioningsService: VersioningsService;

  get type() {
    return 'version:override';
  }

  async run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void> {
    const project = this.projectsService.get(action.projectId);
    const sourceTargetIds = targetsStreams
      ? Object.keys(targetsStreams)
      : project.getFlow(action.flowId).targets;

    for (const tIdOfSource of sourceTargetIds) {
      for (const tIdOfTarget of action.targets) {
        const source = project.getTargetByTargetId(tIdOfSource);
        const target = project.getTargetByTargetId(tIdOfTarget);

        await this.versioningsService.getByTarget(target).override(source, target);
      }
    }
  }
}
