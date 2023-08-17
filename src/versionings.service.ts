import { Service } from 'typedi';
import { EntitiesService } from './entities.service';
import { IVersioningService } from './versionings/versioning.service';
import { IProjectTarget, IProjectTargetDef } from './project';

@Service()
export class VersioningsService extends EntitiesService<IVersioningService> {
  protected factories: Record<string, { new (...args): IVersioningService, type: string }> = {};

  get domain() {
    return 'Versioning';
  }

  getByTarget(target: IProjectTargetDef): IVersioningService {
    return this.get(target.versioning);
  }

  addFactory(cls: { new (...args): IVersioningService, type: string }) {
    this.factories[cls.type] = cls;

    return this;
  }

  getInstance(type: string, ...args): IVersioningService {
    if (!this.factories[type]) {
      throw `${this.domain} "${type}" is not registered`;
    }

    return new this.factories[type](...args);
  }
}
