import express from 'express';
import { IService } from '../entities.service';
import { IUser } from '../user';

export interface IAuthStrategyMethod {
  id?: string;
  type: string;

  title?: string;
  description?: string;

  actions: Record<string, any>;
}

export interface IAuthStrategyService extends IService {
  authorize(data: Record<string, any>): Promise<IUser>;

  request(): Promise<IAuthStrategyMethod>;

  configureServer(app: express.Application): Promise<void>;
}
