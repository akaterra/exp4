import { logger } from '../../logger';
import { statistics } from '../../statistics.service';

export function statisticsList(req, res) {
  logger.info({ message: 'projectStreamList', data: req.data });

  res.json(statistics.state);
}
