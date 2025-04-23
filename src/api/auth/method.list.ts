import Container from 'typedi';
import { AuthStrategyHolderService } from '../../auth/index';
import { logger } from '../../logger';

const authStrategiesServiceAuth = Container.get(AuthStrategyHolderService);

// /auth/methods
export async function authMethodList(req, res) {
  logger.info({ message: 'authMethodList', data: req.data });

  res.json(await authStrategiesServiceAuth.list());
}
