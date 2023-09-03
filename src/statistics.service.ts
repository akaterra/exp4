import { Service } from 'typedi';
import * as _ from 'lodash';

@Service()
export class StatisticsService {
  state: Record<string, any> = {};

  add(key: string | string[], val, max = 10) {
    let old = _.get(this.state, key) ?? [];

    if (!Array.isArray(old)) {
      old = [];
    }

    old.push(val);

    if (old.length > max) {
      old = old.slice(-max);
    }

    _.set(this.state, key, old);
  }

  inc(key: string | string[], adder: number = 1) {
    const old = _.get(this.state, key);

    _.set(this.state, key, typeof old !== 'number' ? adder : old + adder);
  }

  set(key: string | string[], val) {
    _.set(this.state, key, val);
  }
}
