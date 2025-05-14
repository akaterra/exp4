import Container from 'typedi';
import { ProjectsService } from '../../projects.service';
import { logger } from '../../logger';
import { ReleaseState } from '../../release-state';
import {markDirty} from '../../actions/utils';

const projectsService = Container.get(ProjectsService);

// /projects/:projectId/target/:targetId/release
export async function projectTargetReleaseUpdate(req, res) {
  logger.info({ message: 'projectTargetReleaseUpdate', data: req.data });

  const project = projectsService.get(req.params.projectId);
  const targetState = await project.rereadTargetStateByTarget(req.params.targetId);
  const targetReleaseState = targetState.getExtension<ReleaseState>('release', 'release', true);

  if (!targetReleaseState) {
    return res.status(404).json({ message: 'Release extension not found' });
  }

  if (req.body.date) {
    targetReleaseState.date = new Date(req.body.date);
  }

  if (req.body.status) {
    targetReleaseState.setStatus(req.body.status);
  }

  if (req.body.sections) {
    targetReleaseState.sections = targetReleaseState.sections.filter((section) => section.type !== 'op');
  }

  for (const section of req.body.sections) {
    if (section.type === 'note') {
      section.level = 0;
    } else if (section.type === 'stream') {
      section.level = 1;
    } else if (section.type === 'op') {
      section.level = 2;
    }

    targetReleaseState.setSection(section);
  }

  markDirty(targetState);

  res.json(targetReleaseState.toJSON());
}
