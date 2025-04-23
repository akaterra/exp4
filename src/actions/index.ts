import { IService } from '../entities.service';
import { IProjectActionDef, IProjectFlowDef } from '../project';
import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from '../entities.service';

export interface IActionService extends IService {
  run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ): Promise<void>;
}

@Service()
export class ActionHolderService extends EntitiesServiceWithFactory<IActionService> {
  get domain() {
    return 'Action';
  }
}
