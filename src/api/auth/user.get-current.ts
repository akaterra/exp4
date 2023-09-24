import { logger } from '../../logger';

// /auth/users/current
export async function authUserGetCurrent(req, res) {
  logger.info({ message: 'authUserGetCurrent', data: req.data });

  res.json(req.user);
}
