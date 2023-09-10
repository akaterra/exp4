import { statistics } from '../../statistics.service';

export function statisticsList(req, res) {
  res.json(statistics.state);
}
