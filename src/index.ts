import 'reflect-metadata';
import 'universal-dotenv/register';
import cors from 'cors';
import { loadProjectFromFile, loadProjectsFromDirectory } from './project-loader';
import { GithubStreamService, IGithubTargetStream } from './streams/github';
import Container from 'typedi';
import { IStorageService } from './storages/storage.service';
import { GithubStorageService } from './storages/github';
import { VersioningsService } from './versionings.service';
import { ProjectsService } from './projects.service';
import { StreamsService } from './streams.service';
import { StoragesService } from './storages.service';
import express from 'express';
import { projectStreamList } from './api/project-state/list';
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
import { StreamVersionOverrideActionService } from './actions/stream-version-override';
import { DetachActionService } from './actions/detach';
import { loadGlobalConfigFromFile } from './global-config-loader';
import { AuthStrategiesService } from './auth-strategies.service';
import { GithubAuthStrategyService } from './auth/github';
import { err, loadDefinitionsFromDirectory } from './utils';
import { authMethodList } from './api/auth/list-methods';
import { statisticsList } from './api/statistics/list';
import { authorize } from './auth.service';

function auth(req, res, next) {
  req.user = authorize(req.headers.authorization);

  next();
}

(async () => {
  const integrations = Container.get(IntegrationsService);
  integrations.addFactory(GithubIntegrationService);
  const actions = Container.get(ActionsService);
  actions.add(Container.get(DetachActionService));
  actions.add(Container.get(MoveFromActionService));
  actions.add(Container.get(MoveToActionService));
  actions.add(Container.get(VersionOverrideActionService));
  actions.add(Container.get(VersionPatchActionService));
  actions.add(Container.get(VersionReleaseActionService));
  actions.add(Container.get(RunActionActionService));
  actions.add(Container.get(StreamVersionOverrideActionService));
  const storages = Container.get(StoragesService);
  storages.addFactory(GithubStorageService);
  const streams = Container.get(StreamsService);
  streams.addFactory(GithubStreamService);
  const versionings = Container.get(VersioningsService);
  versionings.addFactory(SemverVersioningService);
  versionings.addFactory(StubVersioningService);
  const projects = Container.get(ProjectsService);
  const authStrategies = Container.get(AuthStrategiesService);
  authStrategies.addFactory(GithubAuthStrategyService);

  const c = loadGlobalConfigFromFile('global');
  const p = loadProjectsFromDirectory('./projects', (process.env.PROJECT_IDS ?? '').split(','));

  p.forEach((p) => projects.add(p));

  // console.log({p});
  // projects.add(p);

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

    if (!res.statusCode || res.statusCode < 300) {
      res.status(500);
    }

    res.send(JSON.stringify(err?.message ?? err));
  }
 
  await authStrategies.configureServer(app);

  app.get(
    '/auth/methods', err(authMethodList),
  );
  app.get(
    '/projects', err(auth), err(projectList),
  );
  app.get(
    '/projects/:projectId/streams', err(auth), err(projectStreamList),
  );
  app.post(
    '/projects/:projectId/flow/:flowId/action/:actionId/run', err(auth), err(projectFlowActionRun),
  );
  app.get(
    '/statistics', err(auth), err(statisticsList),
  );

  app.use(error);
  
  app.listen(7000, () => {

  });

  projects.runStatesResync();
})().catch((err) => {
  console.error({
    err,
    stack: err.stack,
  })
});
