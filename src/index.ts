import 'reflect-metadata';
import 'source-map-support/register';
import 'universal-dotenv/register';
import cors from 'cors';
import { createProject } from './project-loader';
import { GithubStreamService } from './streams/github';
import Container from 'typedi';
import { ProjectsService } from './projects.service';
import { StreamsService } from './streams.service';
import express from 'express';
import { projectStreamList } from './api/project-state/list';
import { projectList } from './api/project/list';
import { projectFlowActionRun } from './api/project-flow/action.run';
import { createGeneral } from './global-config-loader';
import { AuthStrategiesService } from './auth-strategies.service';
import { GithubAuthStrategyService } from './auth/github';
import { err, loadModules } from './utils';
import { authMethodList } from './api/auth/method.list';
import { statisticsList } from './api/statistics/list';
import { authorize } from './auth.service';
import { logError } from './logger';
import { authUserGetCurrent } from './api/auth/user.get-current';
import {StoragesService} from './storages.service';
import {IGeneralManifest} from './global-config';
import {IProjectManifest} from './project';

process.on('uncaughtException', function() {
});

function auth(req, res, next) {
  req.user = authorize(req.headers.authorization);

  next();
}

(async () => {
  const projects = Container.get(ProjectsService);
  const storages = new StoragesService();

  for (const storageSymbol of await loadModules(__dirname + '/storages', 'StorageService')) {
    storages.addFactory(storageSymbol);

    const storage = storages.getInstance(storageSymbol.type);
    const manifests = await storage.manifestsLoad('./projects');

    for (const manifest of manifests) {
      await createGeneral(manifest as IGeneralManifest, true);
      const project = await createProject(manifest as IProjectManifest, true);

      if (project) {
        projects.add(project);
      }
    }
  }

  const authStrategies = Container.get(AuthStrategiesService);
  authStrategies.addFactory(GithubAuthStrategyService);

  const ss = Container.get(StreamsService);
  ss.addFactory(GithubStreamService);

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  function error(err, req, res) {
    logError(err);

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
    '/auth/users/current', err(auth), err(authUserGetCurrent),
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
  logError(err);
});
