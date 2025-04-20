import { Service } from 'typedi';
import { IVersioningService } from './_versioning.service';
import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';

@Service()
export class StubVersioningService extends EntityService implements IVersioningService {
  static readonly type: string = null;

  async getCurrent(target: IProjectTargetDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async format(version: string, format?: string) { // eslint-disable-line
    return version;
  }

  async override(source: IProjectTargetDef, target: IProjectTargetDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async patch(target: IProjectTargetDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async release(target: IProjectTargetDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async rollback(target: IProjectTargetDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async getCurrentStream(target: IProjectTargetStreamDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async formatStream(version: string, format?: string) { // eslint-disable-line
    return version;
  }

  async overrideStream(source: IProjectTargetDef, target: IProjectTargetStreamDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async patchStream(target: IProjectTargetStreamDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async releaseStream(target: IProjectTargetStreamDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async rollbackStream(target: IProjectTargetStreamDef): Promise<string> { // eslint-disable-line
    return null;
  }

  async exec(source: IProjectTargetDef, target: IProjectTargetDef, action: string): Promise<string> { // eslint-disable-line
    return null;
  }
}
