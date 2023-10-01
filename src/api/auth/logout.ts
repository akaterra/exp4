import Container from 'typedi';
import { AuthStrategiesService } from '../../auth-strategies.service';
import { logger } from '../../logger';
import {authLogout as execAuthLogout} from '../../auth.service';

const authStrategiesServiceAuth = Container.get(AuthStrategiesService);

// /auth/logout
export async function authLogout(req, res) {
  logger.info({ message: 'authLogout', data: req.data });

  execAuthLogout(req, res);
}
