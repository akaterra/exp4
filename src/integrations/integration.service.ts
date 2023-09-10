import { IService } from '../entities.service';
import {statistics} from '../statistics.service';

export interface IIntegrationService extends IService {

}

export function IncStatistics() {
  return function (target: Record<string, any>, propertyName: string, descriptor) {
    const fn = target[propertyName];

    Object.assign(descriptor, {
      value: function (...args) {
        statistics.inc(`integrations.${this.type}.calls ${fn.name}`);

        return fn.call(this, ...args);
      }
    });
  }
}
