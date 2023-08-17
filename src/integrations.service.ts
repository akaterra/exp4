import { Service } from 'typedi';
import { IIntegrationService } from './integrations/integration.service';
import { EntitiesService } from './entities.service';

@Service()
export class IntegrationsService extends EntitiesService<IIntegrationService> {
  protected factories: Record<string, { new (...args): IIntegrationService, type: string }> = {};

  get domain() {
    return 'Integration';
  }

  get<T extends IIntegrationService>(id: string, assertType?: string): T {
    const entity = super.get(id);

    if (assertType && entity.type !== assertType) {
      throw new Error(`${this.domain} requested entity "${id}" (${assertType}) with incompatible type (${entity.type})`);
    }

    return entity as T;
  }

  addFactory(cls: { new (...args): IIntegrationService, type: string }) {
    this.factories[cls.type] = cls;

    return this;
  }

  getInstance(type: string, ...args): IIntegrationService {
    if (!this.factories[type]) {
      throw new Error(`${this.domain} "${type}" is not registered`);
    }

    return new this.factories[type](...args);
  }
}
