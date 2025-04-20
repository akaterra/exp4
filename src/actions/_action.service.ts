import { IService } from '../entities.service';
import { IProjectActionDef, IProjectFlowDef } from '../project';

export interface IActionService extends IService {
  run(
    flow: IProjectFlowDef,
    action: IProjectActionDef,
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ): Promise<void>;
}
