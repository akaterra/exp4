import { IService } from '../entities.service';
import { IProjectFlowActionDef } from '../project';

export interface IStepService extends IService {
  run(
    action: IProjectFlowActionDef,
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ): Promise<void>;
}
