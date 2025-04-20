import { Service } from 'typedi';
import { IActionService } from './_action.service';
import { EntitiesServiceWithFactory } from '../entities.service';

@Service()
export class ActionHolderService extends EntitiesServiceWithFactory<IActionService> {
  get domain() {
    return 'Action';
  }
}
