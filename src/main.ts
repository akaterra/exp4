import 'reflect-metadata';
// import 'source-map-support/register';
import 'universal-dotenv/register';
import cors from 'cors';
import { createProject } from './loaders/project-loader';
import { GithubStreamService } from './streams/github';
import Container from 'typedi';
import { ProjectsService } from './projects.service';
import { StreamHolderService } from './streams';
import express from 'express';
import { projectStateList } from './api/project-state/list';
import { projectList } from './api/project/list';
import { projectFlowRun } from './api/project-flow/flow.run';
import { createGeneral } from './loaders/general-loader';
import { AuthStrategyHolderService } from './auth/index';
import { GithubAuthStrategyService } from './auth/github';
import { err, loadModules } from './utils';
import { authMethodList } from './api/auth/method.list';
import { statisticsList } from './api/statistics/list';
import { authorize } from './auth';
import { logError } from './logger';
import { authUserGetCurrent } from './api/auth/user.get-current';
import { StorageHolderService } from './storages';
import { IGeneralManifest } from './general';
import { IProjectManifest } from './project';
import cookieParser from 'cookie-parser';
import { authLogout } from './api/auth/logout';
import SourceMapSupport from 'source-map-support';
import { projectTargetReleaseUpdate } from './api/project-target-state/release.update';
import { HTTP_PORT } from './const';
import { projectTargetReleaseOpFlowRun } from './api/project-target-state/release.op.flow.run';

SourceMapSupport.install({
  environment: 'node',
  handleUncaughtExceptions: true,
});

process.on('uncaughtException', (err) => {
  logError(err, 'uncaughtException');
});

function auth(req, res, next) {
  req.user = authorize(req.headers.authorization || req.cookies.authorization);

  next();
}

(async () => {
  const projects = Container.get(ProjectsService);
  const storages = new StorageHolderService();

  for (const storageSymbol of await loadModules(__dirname + '/storages', 'StorageService')) {
    storages.addFactory(storageSymbol);

    const storage = storages.getInstance(storageSymbol.type);
    const manifests = await storage.manifestsLoad([ './projects' ]);
    const projectsMap: any = {};

    if (process.env.PROJECT_IDS) {
      for (const projectId of process.env.PROJECT_IDS?.split(',')) {
        const projectTargets = projectId.split(':');

        projectsMap[projectTargets[0]] = {};

        if (projectTargets.length > 1) {
          for (const projectTarget of projectTargets.slice(1)) {
            const projectTargetStreams = projectTarget.split('+');

            if (projectTargetStreams.length > 1) {
              projectsMap[projectTargets[0]][projectTargetStreams[0]] = {};

              for (const projectTargetStream of projectTargetStreams.slice(1)) {
                projectsMap[projectTargets[0]][projectTargetStreams[0]][projectTargetStream] = true;
              }
            } else {
              projectsMap[projectTargets[0]][projectTargetStreams[0]] = true;
            }
          }
        }
      }
    }

    const projectIds: string[] = Object.keys(projectsMap).length > 0 ? Object.keys(projectsMap) : null;

    for (const manifest of manifests) {
      await createGeneral(manifest as IGeneralManifest, true);
      const project = await createProject(
        manifest as IProjectManifest,
        true,
        projectsMap[manifest.id] && Object.keys(projectsMap[manifest.id]).length
          ? projectsMap[manifest.id]
          : null,
      );

      if (project) {
        if (!projectIds || projectIds.includes(project.id)) {
          projects.add(project);
        }
      }
    }
  }

  const authStrategies = Container.get(AuthStrategyHolderService);
  authStrategies.addFactory(GithubAuthStrategyService);

  // const ss = Container.get(StreamHolderService);
  // ss.addFactory(GithubStreamService);

  const app = express();
  app.use(cors({ credentials: true, origin: 'http://localhost:9002' }));
  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Headers', 'Set-Cookie, Cookie');

    next();
  })

  function error(err, req, res, next) {
    logError(err);

    if (res.headersSent) {
      return next(err);
    }

    if (!res.statusCode || res.statusCode < 300) {
      res.status(500);
    }

    res.send(JSON.stringify(err?.message ?? err));
  }
 
  await authStrategies.configureServer(app);

  app.post(
    '/auth/logout', err(authLogout),
  );
  app.get(
    '/auth/methods', err(authMethodList),
  );
  app.get(
    '/auth/users/current', err(auth), err(authUserGetCurrent),
  );
  app.get(
    '/projects', err(auth), err(projectList),
  );
  app.post(
    '/projects/:projectId/state', err(auth), err(projectStateList),
  );
  app.post(
    '/projects/:projectId/flow/:flowId/run', err(auth), err(projectFlowRun),
  );
  app.put(
    '/projects/:projectId/target/:targetId/release', err(auth), err(projectTargetReleaseUpdate),
  );
  app.post(
    '/projects/:projectId/target/:targetId/release/op/:opId/flow/:flowId/run', err(auth), err(projectTargetReleaseOpFlowRun),
  );
  app.get(
    '/statistics', err(auth), err(statisticsList),
  );

  app.use(error);
  
  app.listen(HTTP_PORT, () => {

  });

  projects.runStatesResync();
  projects.runStatesSave();
})().catch((err) => {
  logError(err);
});
