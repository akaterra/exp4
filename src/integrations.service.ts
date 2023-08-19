import { Service } from 'typedi';
import { IIntegrationService } from './integrations/integration.service';
import { EntitiesServiceWithFactory } from './entities.service';

@Service()
export class IntegrationsService extends EntitiesServiceWithFactory<IIntegrationService> {
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
}
