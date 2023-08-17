import { Service } from 'typedi';
import { IActionService } from './actions/action.service';
import { EntitiesService } from './entities.service';

@Service()
export class ActionsService extends EntitiesService<IActionService> {
  get domain() {
    return 'Action';
  }
}
