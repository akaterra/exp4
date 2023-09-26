import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { Log } from '../logger';

@Service()
export class StubStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'stub';

  @Log('debug')
  async userGet(): Promise<IUser> {
    return null;
  }

  @Log('debug')
  async userSet(): Promise<void> {

  }

  @Log('debug')
  async varGet<D>(): Promise<D> {
    return null;
  }

  @Log('debug')
  async varSet(): Promise<void> {

  }

  @Log('debug')
  async varAdd<D>(): Promise<D> {
    return null;
  }

  @Log('debug')
  async varInc(): Promise<number> {
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
