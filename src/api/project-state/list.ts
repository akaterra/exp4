import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/state
export async function projectStateList(req, res) {
  logger.info({ message: 'projectStreamList', data: req.data });

  const targetStreams = req.query.targetId
    ? req.query.targetId.split(',').reduce((acc, targetId) => {
      acc[targetId] = true;

      return acc
    }, {})
    : Array.isArray(req.body?.targetId)
      ? req.body.targetId.reduce((acc, targetId) => {
        acc[targetId] = true;

        return acc
      }, {})
      : req.body?.targetId ?? null;
  const scopes = req.query?.scopes
    ? req.query.scopes.split(',').reduce((acc, scope) => {
      acc[scope] = true;

      return acc
    }, {})
    : Array.isArray(req.body?.scopes)
      ? req.body.scopes.reduce((acc, scope) => {
        acc[scope] = true;

        return acc
      }, {})
      : req.body?.scopes ?? null;

  res.json(await projectsService.getState(req.params.projectId, targetStreams, scopes));
}
