import { Service } from 'typedi';
import { IStorageService } from './_storage.service';
import { EntitiesServiceWithFactory } from '../entities.service';

@Service()
export class StorageHolderService extends EntitiesServiceWithFactory<IStorageService> {
  get domain() {
    return 'Storage';
  }
}
