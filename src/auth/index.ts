import express from 'express';
import { IEntityService, IService } from '../entities.service';
import { IUser } from '../user';
import { Service } from 'typedi';
import { EntitiesServiceWithFactory } from '../entities.service';
import * as _ from 'lodash';

export interface IAuthStrategyMethod {
  id?: string;
  type: string;

  title?: string;
  description?: string;

  actions: Record<string, any>;
}

export interface IAuthStrategyService extends IEntityService {
  authorize(data: Record<string, any>): Promise<IUser>;

  request(): Promise<IAuthStrategyMethod>;

  configureServer(app: express.Application): Promise<void>;
}

@Service()
export class AuthStrategyHolderService extends EntitiesServiceWithFactory<IAuthStrategyService> {
  get domain() {
    return 'Auth strategy';
  }

  async configureServer(app: express.Application) {
    for (const entity of Object.values(this.entities)) {
      await entity.configureServer(app);
    }
  }

  list(): Record<string, Pick<IAuthStrategyMethod, 'id' | 'type' | 'title' | 'description'>> {
    return _.mapValues(this.entities, (entity) => ({
      id: entity.id,
      type: entity.type,
      title: entity.title,
      description: entity.description,
    }));
  }
}
