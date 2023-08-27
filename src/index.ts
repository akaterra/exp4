import 'reflect-metadata';
import 'universal-dotenv/register';
import cors from 'cors';
import { loadFromFile } from './project-loader';
import { GithubStreamService, IGithubTargetStream } from './streams/github';
import Container from 'typedi';
import { IStorageService } from './storages/storage.service';
import { GithubStorageService } from './storages/github';
import { VersioningsService } from './versionings.service';
import { ProjectsService } from './projects.service';
import { StreamsService } from './streams.service';
import { StoragesService } from './storages.service';
import express from 'express';
import { projectStreamList } from './api/project-stream/list';
import { projectList } from './api/project/list';
import { ActionsService } from './actions.service';
import { VersionReleaseActionService } from './actions/version-release';
import { projectFlowActionRun } from './api/project-flow/action.run';
import { VersionPatchActionService } from './actions/version-patch';
import { MoveToActionService } from './actions/move-to';
import { MoveFromActionService } from './actions/move-from';
import { IntegrationsService } from './integrations.service';
import { GithubIntegrationService } from './integrations/github';
import { VersionOverrideActionService } from './actions/version-override';
import { RunActionActionService } from './actions/run-action';
import { SemverVersioningService } from './versionings/semver';
import { StubVersioningService } from './versionings/stub';

(async () => {
  const integrations = Container.get(IntegrationsService);
  integrations.addFactory(GithubIntegrationService);
  const actions = Container.get(ActionsService);
  actions.add(Container.get(MoveFromActionService));
  actions.add(Container.get(MoveToActionService));
  actions.add(Container.get(VersionOverrideActionService));
  actions.add(Container.get(VersionPatchActionService));
  actions.add(Container.get(VersionReleaseActionService));
  actions.add(Container.get(RunActionActionService));
  const storages = Container.get(StoragesService);
  storages.addFactory(GithubStorageService);
  const streams = Container.get(StreamsService);
  streams.addFactory(GithubStreamService);
  const versionings = Container.get(VersioningsService);
  versionings.addFactory(SemverVersioningService);
  versionings.addFactory(StubVersioningService);
  const projects = Container.get(ProjectsService);

  const p = loadFromFile('test');
  // console.log({p});
  projects.add(p);

  const ss = Container.get(StreamsService);
  ss.addFactory(GithubStreamService);

  // const stream = p.getTargetStream<IGithubTargetStream>('dev', 'gp-deliveries-service');

  // const s = await projects.streamGetState(stream);
  // console.log(s);
  // const t = await projects.targetGetState('test', 'dev');
  // console.log(t);
  // const s = await projects.streamGetStateAll('test', ['dev','stg','production']);
  // console.log(s);


  // await versioning.patch(stream);

  const app = express();
  app.use(cors());
  app.use(express.json());

  function error(err, req, res, next) {
    console.error(err, err.stack);

    res.status(500);
    res.send(JSON.stringify(err?.message ?? err));
  }

  function err(fn) {
    return function (req, res, next) {
      try {
        const result = fn(req, res, next);

        if (result instanceof Promise) {
          result.catch((err) => {
            next(err);
          });
        }
      } catch (err) {
        next(err);
      }
    };
  }
 
  app.get(
    '/projects', err(projectList),
  );
  app.get(
    '/projects/:projectId/streams', err(projectStreamList),
  );
  app.post(
    '/projects/:projectId/flow/:flowId/action/:actionId/run', err(projectFlowActionRun),
  );

  app.use(error);
  
  app.listen(7000, () => {

  });
})().catch((err) => {
  console.error({
    err,
    stack: err.stack,
  })
});
