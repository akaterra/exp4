import { Service } from 'typedi';
import { IIntegrationService } from './integrations/integration.service';
import { EntitiesServiceWithFactory } from './entities.service';

@Service()
export class IntegrationsService extends EntitiesServiceWithFactory<IIntegrationService> {
  get domain() {
    return 'Integration';
  }
}
