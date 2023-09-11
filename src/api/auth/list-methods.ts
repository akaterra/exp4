import Container from 'typedi';
import { AuthStrategiesService } from '../../auth-strategies.service';
import { logger } from '../../logger';

const authStrategiesServiceauth = Container.get(AuthStrategiesService);

// /auth/methods
export async function authMethodList(req, res) {
  logger.info({ message: 'authMethodList', data: req.data });

  res.json(await authStrategiesServiceauth.list());
}
