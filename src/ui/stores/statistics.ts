import { flow, observable, makeObservable } from 'mobx';
import { StatisticsService } from '../services/statistics.service';
import { BaseStore } from './base-store';
import { processing } from './utils';

export class StatisticsStore extends BaseStore {
  readonly service = new StatisticsService();

  @observable
  statistics: Record<string, any> = {};

  constructor() {
    super();
    makeObservable(this);
  }

  @flow @processing
  *fetch() {
    this.statistics = yield this.service.list();
  }
}
