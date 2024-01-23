import { IService } from '../entities.service';
import { IProjectFlowActionStepDef, IProjectFlowDef } from '../project';

export interface IStepService extends IService {
  run(
    flow: IProjectFlowDef,
    step: IProjectFlowActionStepDef,
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ): Promise<void>;
}
