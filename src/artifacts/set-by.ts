import { Service } from 'typedi';
import { IArtifactService } from './artifact.service';
import { IProjectArtifact, IProjectDef } from '../project';
import { IStream } from '../stream';
import {EntityService} from '../entities.service';

export type SetByArtifactConfig = {
  source: string;
  target: Record<string, {
    pattern: RegExp | string;
    keys: ({ index: string, title: string, type: string } | number | string)[];
    type: string;
  }>;
};

@Service()
export class SetByArtifactService extends EntityService implements IArtifactService {
  static readonly assertType: string = '*';
  static readonly type: string = 'setBy';

  constructor(public readonly config?: SetByArtifactConfig) {
    super();
  }

  async run(
    entity: { artifact: SetByArtifactService, ref: IProjectArtifact['ref'], scope?: Record<string, any> },
    streamState: IStream,
    params?: Record<string, any>,
  ): Promise<void> {
    if (this.config?.source && this.config?.target) {
      const source = entity?.scope?.[this.config?.source];

      if (typeof source === 'string') {
        for (const [ defId, defConfig ] of Object.entries(this.config?.target)) {
          if (defConfig.pattern && defConfig.keys?.length) {
            if (!(defConfig.pattern instanceof RegExp)) {
              defConfig.pattern = new RegExp(defConfig.pattern);
            }

            const groups = (defConfig.pattern as RegExp).exec(source);

            if (groups) {
              for (const key of defConfig.keys) {
                if (typeof key === 'number' || typeof key === 'string') {
                  if (groups[key]) {
                    streamState.history.artifact.push({
                      id: typeof key !== 'string' ? defId : key,
                      type: defConfig.type ?? defId,
                      author: null,
                      description: groups[key],
                      link: null,
                      metadata: { [ typeof key !== 'string' ? defId : key ]: groups[key] },
                      steps: null,
                      time: null,
                    });
                  }
                } else {
                  if (groups[key.index]) {
                    streamState.history.artifact.push({
                      id: key.title,
                      type: key.type ?? defConfig.type ?? defId,
                      author: null,
                      description: groups[key.title],
                      link: null,
                      metadata: { [ key.title ]: groups[key.index] },
                      steps: null,
                      time: null,
                    });
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
