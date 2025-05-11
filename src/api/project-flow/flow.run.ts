import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/flow/:flowId/run
export async function projectFlowRun(req, res) {
  logger.info({ message: 'projectFlowActionRun', data: req.data });

  res.json(await projectsService.get(req.params.projectId).flowRun(
    req.params.flowId.split(','),
    req.body?.targetsStreams,
    req.body?.params,
  ));
}
