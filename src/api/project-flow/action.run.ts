import Container from 'typedi';
import { ProjectsService } from '../../projects.service';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/flow/:flowId/action/:actionId/run
export async function projectFlowActionRun(req, res) {
  res.json(await projectsService.flowActionRun(
    req.params.projectId,
    req.params.flowId,
    req.params.actionId?.split(','),
    req.body,
  ));
}
