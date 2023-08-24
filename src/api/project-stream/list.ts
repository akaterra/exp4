import Container from 'typedi';
import { ProjectsService } from '../../projects.service';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/streams
export async function projectStreamList(req, res) {
  res.json(await projectsService.getState(req.params.projectId, req.query.targetId?.split(',')));
}
