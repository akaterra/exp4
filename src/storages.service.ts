import { Service } from 'typedi';
import { IStorageService } from './storages/storage.service';
import { EntitiesService } from './entities.service';

@Service()
export class StoragesService extends EntitiesService<IStorageService> {
  protected factories: Record<string, { new (...args): IStorageService, type: string }> = {};

  get domain() {
    return 'Storage';
  }

  addFactory(cls: { new (...args): IStorageService, type: string }) {
    this.factories[cls.type] = cls;

    return this;
  }

  getInstance(type: string, ...args): IStorageService {
    if (!this.factories[type]) {
      throw `${this.domain} "${type}" is not registered`;
    }

    return new this.factories[type](...args);
  }
}
