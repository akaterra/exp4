import { IService } from '../entities.service';
import { statistics } from '../statistics.service';
import { IS_TEST } from '../utils';

export interface IIntegrationService extends IService {

}

export function IncStatistics() {
  return function (target: Record<string, any>, propertyName: string, descriptor) {
    if (IS_TEST) {
      return;
    }

    const fn = descriptor.value;

    descriptor.value = function (...args) {
      statistics.inc(`integrations.${this.type}.${fn.name} calls`);

      return fn.call(this, ...args);
    };

    Object.defineProperty(descriptor.value, 'name', { value: fn.name });
  }
}
