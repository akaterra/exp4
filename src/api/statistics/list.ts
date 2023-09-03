import Container from 'typedi';
import { StatisticsService } from '../../statistics.service';

const statisticsService = Container.get(StatisticsService);

export function statisticsList(req, res) {
  res.json(statisticsService.state);
}
