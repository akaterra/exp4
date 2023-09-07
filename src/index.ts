import 'reflect-metadata';
import 'source-map-support/register';
import 'universal-dotenv/register';
import cors from 'cors';
import { loadProjectsFromDirectory } from './project-loader';
import { GithubStreamService } from './streams/github';
import Container from 'typedi';
import { ProjectsService } from './projects.service';
import { StreamsService } from './streams.service';
import express from 'express';
import { projectStreamList } from './api/project-state/list';
import { projectList } from './api/project/list';
import { projectFlowActionRun } from './api/project-flow/action.run';
import { loadGlobalConfigFromFile } from './global-config-loader';
import { AuthStrategiesService } from './auth-strategies.service';
import { GithubAuthStrategyService } from './auth/github';
import { err } from './utils';
import { authMethodList } from './api/auth/list-methods';
import { statisticsList } from './api/statistics/list';
import { authorize } from './auth.service';

function auth(req, res, next) {
  req.user = authorize(req.headers.authorization);

  next();
}

(async () => {
  const projects = Container.get(ProjectsService);
  const authStrategies = Container.get(AuthStrategiesService);
  authStrategies.addFactory(GithubAuthStrategyService);

  const c = await loadGlobalConfigFromFile('global');
  const p = await loadProjectsFromDirectory('./projects', (process.env.PROJECT_IDS || '').split(',').filter((id) => !!id));

  p.forEach((p) => projects.add(p));

  const ss = Container.get(StreamsService);
  ss.addFactory(GithubStreamService);

  const app = express();
  app.use(cors());
  app.use(express.json());

  function error(err, req, res) {
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
