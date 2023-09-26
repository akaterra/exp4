import { Service } from 'typedi';
import { IStepService } from './steps/step.service';
import { EntitiesService } from './entities.service';

@Service()
export class StepsService extends EntitiesService<IStepService> {
  get domain() {
    return 'Step';
  }
}
