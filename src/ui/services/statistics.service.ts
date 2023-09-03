import { RestApiService } from './rest-api.service';

export class StatisticsService {
  protected rest = new RestApiService();

  list(): Promise<Record<string, any>> {
    return this.rest.get('statistics');
  }
}
