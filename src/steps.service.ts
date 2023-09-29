import { Service } from 'typedi';
import { IStepService } from './steps/step.service';
import { EntitiesServiceWithFactory } from './entities.service';

@Service()
export class StepsService extends EntitiesServiceWithFactory<IStepService> {
  get domain() {
    return 'Step';
  }
}
