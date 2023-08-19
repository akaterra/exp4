import { Service } from 'typedi';
import { IStorageService } from './storages/storage.service';
import { EntitiesServiceWithFactory } from './entities.service';

@Service()
export class StoragesService extends EntitiesServiceWithFactory<IStorageService> {
  get domain() {
    return 'Storage';
  }
}
