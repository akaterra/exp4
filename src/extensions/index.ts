import {Service} from 'typedi';
import { EntitiesServiceWithFactory, IEntityService } from '../entities.service';

export interface IExtensionService extends IEntityService {

}

@Service()
export class ExtensionHolderService extends EntitiesServiceWithFactory<IExtensionService> {
  get domain() {
    return 'Extension';
  }
}
