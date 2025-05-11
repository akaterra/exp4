import { Service } from 'typedi';
import { IActionService } from '.';
import { ProjectsService } from '../projects.service';
import { EntityService } from '../entities.service';
import { Autowired } from '../utils';

@Service()
export class RunActionActionService extends EntityService implements IActionService {
  static readonly type = 'runAction';

  @Autowired() protected projectsService: ProjectsService;

  async run(): Promise<void> {
  }
}
