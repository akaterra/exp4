import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { Log } from '../logger';
import {IGeneralManifest} from '../global-config';
import {IProjectManifest} from '../project';

@Service()
export class StubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'stub';

  @Log('debug')
  async manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>> {
    return [];
  }

  @Log('debug')
  async userGet(): Promise<IUser> {
    return null;
  }

  @Log('debug')
  async userSet(): Promise<void> {

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
}
