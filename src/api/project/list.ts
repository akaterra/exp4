import Container from 'typedi';
import { ProjectsService } from '../../projects.service';

const projectsService = Container.get(ProjectsService);

export function projectList(req, res) {
  res.json(projectsService.list());
}
