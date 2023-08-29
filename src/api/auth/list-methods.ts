import Container from 'typedi';
import { AuthStrategiesService } from '../../auth-strategies.service';

const authStrategiesServiceauth = Container.get(AuthStrategiesService);

// /auth/methods
export async function authMethodList(req, res) {
  res.json(await authStrategiesServiceauth.list());
}
