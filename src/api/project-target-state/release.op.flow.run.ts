import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';
import { IProjectTargetStreamDef } from '../../project';
import { ReleaseState } from '../../release-state';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/target/:targetId/release/op/:opId/flow/:flowId/run
export async function projectTargetReleaseOpFlowRun(req, res) {
  logger.info({ message: 'projectTargetReleaseOpFlowRun', data: req.data });

  const project = projectsService.get(req.params.projectId);
  const targetState = await project.rereadTargetStateByTarget(req.params.targetId);
  const targetReleaseState = targetState.getExtension<ReleaseState>('release', 'release', true);

  if (!targetReleaseState) {
    return res.status(404).json({ message: 'Release extension not found' });
  }

  const targetStateReleaseSection = targetReleaseState.getSection(req.params.opId, 'op');

  res.json(await project.flowRun(
    req.params.flowId,
    { [req.params.targetId]: [ targetStateReleaseSection.metadata?.streamId as IProjectTargetStreamDef['id'] ] },
    req.body?.params,
  ));
}
