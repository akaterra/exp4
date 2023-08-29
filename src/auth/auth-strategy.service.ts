import express from 'express';
import { IService } from '../entities.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { User } from '../user';

export interface IAuthStrategyRequestActionsDto {
  id?: string;
  type: string;

  title?: string;
  description?: string;

  actions: Record<string, any>;
}

export interface IAuthStrategyService extends IService {
  authorize(data: Record<string, any>): Promise<User>;

  request(): Promise<IAuthStrategyRequestActionsDto>;

  configureServer(app: express.Application): Promise<void>;
}
