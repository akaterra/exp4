import { logger } from '../../logger';
import { authLogout as execAuthLogout } from '../../auth.service';

// /auth/logout
export async function authLogout(req, res) {
  logger.info({ message: 'authLogout', data: req.data });

  execAuthLogout(req, res);
}
