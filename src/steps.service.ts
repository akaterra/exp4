import { Service } from 'typedi';
import { IActionService } from './actions/step.service';
import { EntitiesServiceWithFactory } from './entities.service';

@Service()
export class ActionsService extends EntitiesServiceWithFactory<IActionService> {
  get domain() {
    return 'Action';
  }
}
