import { Service } from 'typedi';
import { EntityService, IService } from '../entities.service';
import { IProjectArtifact } from '../project';
import { IStream } from '../stream';
import { Autowired } from '../utils';
import { ProjectsService } from '../projects.service';

export interface IArtifactService extends IService {
  run(
    entity: { ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: IStream,
    params?: Record<string, any>,
  ): Promise<void>;
}
