import { IService } from '../entities.service';
import { IProjectFlowActionDef } from '../project';

export interface IActionService extends IService {
  run(action: IProjectFlowActionDef, targetsStreams?: Record<string, [ string, ...string[] ] | true>): Promise<void>;
}
