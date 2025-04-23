import { Service } from 'typedi';
import { IStorageService } from '.';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { Log } from '../logger';
import { IGeneralManifest } from '../general';
import { IProjectManifest } from '../project';
import { TargetState } from '../target';
import { ReleaseState } from '../release';

@Service()
export class StubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'stub';

  @Log('debug')
  async manifestsLoad(): Promise<Array<IGeneralManifest | IProjectManifest>> {
    return [];
  }

  @Log('debug')
  async releaseGet(target: TargetState, def?: ReleaseState): Promise<ReleaseState> {
    return null;
  }

  @Log('debug')
  async releaseSet(target: TargetState): Promise<void> {
    return null;
  }

  @Log('debug')
  async userGet(): Promise<IUser> {
    return null;
  }

  @Log('debug')
  async userGetByKeyAndType(): Promise<IUser> {
    return null;
  }

  @Log('debug')
  async userSetByKeyAndType(): Promise<void> {

  }

  @Log('debug')
  async varGetTarget<D>(): Promise<D> {
    return null;
  }

  @Log('debug')
  async varSetTarget(): Promise<void> {

  }

  @Log('debug')
  async varAddTarget<D>(): Promise<D> {
    return null;
  }

  @Log('debug')
  async varIncTarget(): Promise<number> {
    return null;
  }

  async varGetStream<D>(): Promise<D> {
    return null;
  }

  @Log('debug')
  async varSetStream(): Promise<void> {
    return null;
  }

  @Log('debug')
  async varAddStream<D>(): Promise<D> {
    return null;
  }

  @Log('debug')
  async varIncStream(): Promise<number> {
    return null;
  }

  async truncateAll(): Promise<void> {

  }
}
