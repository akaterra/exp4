import express from 'express';
import { Service } from 'typedi';
import { IAuthStrategyMethod, IAuthStrategyService } from './_auth-strategy.service';
import { EntitiesServiceWithFactory } from '../entities.service';
import * as _ from 'lodash';

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
