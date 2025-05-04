import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/target/:targetId/release
export async function projectTargetReleaseUpdate(req, res) {
  logger.info({ message: 'projectTargetReleaseUpdate', data: req.data });

  const project = projectsService.get(req.params.projectId);
  const targetState = await project.rereadTargetStateByTarget(req.params.targetId);

  if (req.body.date) {
    targetState.release.date = new Date(req.body.date);
  }

  if (req.body.status) {
    targetState.release.setStatus(req.body.status);
  }

  for (const section of req.body.sections) {
    if (section.type === 'note') {
      section.level = 0;
    } else if (section.type === 'stream') {
      section.level = 1;
    } else if (section.type === 'op') {
      section.level = 2;
    }

    targetState.release.setSection(section);
  }

  await project.updateTargetState(targetState);

  res.json(targetState.release.toJSON());
}
