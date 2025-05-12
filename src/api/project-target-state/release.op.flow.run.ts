import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';
import { IProjectTargetStreamDef } from '../../project';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/target/:targetId/release/op/:opId/flow/:flowId/run
export async function projectTargetReleaseOpFlowRun(req, res) {
  logger.info({ message: 'projectTargetReleaseOpFlowRun', data: req.data });

  const project = projectsService.get(req.params.projectId);
  const targetState = await project.rereadTargetStateByTarget(req.params.targetId);
  const targetStateReleaseSection = targetState.release.getSection(req.params.opId, 'op');

  res.json(await project.flowRun(
    req.params.flowId,
    { [req.params.targetId]: [ targetStateReleaseSection.metadata?.streamId as IProjectTargetStreamDef['id'] ] },
    req.body?.params,
  ));
}
