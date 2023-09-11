import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';

const projectsService = Container.get(ProjectsService);

export function projectList(req, res) {
  logger.info({ message: 'projectList', data: req.data });

  res.json(projectsService.list());
}
