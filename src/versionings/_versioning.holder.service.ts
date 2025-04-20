import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from '../entities.service';
import { IVersioningService } from '../versionings/_versioning.service';
import { IProjectTargetDef } from '../project';

@Service()
export class VersioningHolderService extends EntitiesServiceWithFactory<IVersioningService> {
  get domain() {
    return 'Versioning';
  }

  getByTarget(target: IProjectTargetDef): IVersioningService {
    return this.get(target.versioning);
  }
}
