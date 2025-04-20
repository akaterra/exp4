import { Service } from 'typedi';
import { IIntegrationService } from './_integration.service';
import { EntitiesServiceWithFactory } from '../entities.service';

@Service()
export class IntegrationHolderService extends EntitiesServiceWithFactory<IIntegrationService> {
  get domain() {
    return 'Integration';
  }
}
