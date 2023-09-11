import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import {Log, logger} from '../../logger';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/streams
export async function projectStreamList(req, res) {
  logger.info({ message: 'projectStreamList', data: req.data });

  res.json(await projectsService.getState(req.params.projectId /*, req.query.targetId?.split(',') */));
}
