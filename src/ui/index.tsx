import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
import './index.css';
import './mini.min.css';
import 'normalize.css';
import { Navigation } from './blocks/navigation';
import { ProjectsStore } from './stores/projects';
import { Row } from './atoms/row';
import { Project } from './blocks/project';
import { observer } from 'mobx-react-lite';
import { GlobalModal } from './blocks/modal';
import { GlobalDetailsPanel } from './blocks/details-panel';
import { GlobalAlerts } from './blocks/alerts';
import { RootStore, rootStore } from './stores/root';
import {
  createBrowserRouter,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import { IProject } from './stores/dto/project';
import { Statistics } from './blocks/statistics';
import { Top } from './blocks/top';
import { Logo } from './blocks/logo';

export const RouteProject = observer(({ projects }: { projects: ProjectsStore }) => {
  return <Project project={ projects.selectedProjectStore } />;
});

export const Layout = observer(({ rootStore }: { rootStore: RootStore }) => {
  return <React.Fragment>
    <div className='c-3 -s-'>
      <Navigation projects={ rootStore.projectsStore } root={ rootStore } />
    </div>
    <div className='c15 -s-'>
      {
        rootStore.isAuthorized
          ? <Outlet />
          : null
      }
    </div>
  </React.Fragment>;
});

let router;

export const App = () => {
  return <React.Fragment>
    <Logo store={ rootStore } />
    <div className="container med ltr square">
      <GlobalAlerts />
      <GlobalDetailsPanel />
      <GlobalModal />
    </div>
    {/* <div className=''>
      <div className="container med ltr square pad-hor triple">
        <div className='row flex flex-middle'>
          <Top />
        </div>
      </div>
    </div> */}
    <div className='paragraph paragraph-lrg'>
      <div className="container med ltr square pad-hor triple">
        <div className='row'>
          <RouterProvider router={ router } />
        </div>
      </div>
    </div>
  </React.Fragment>;
}

(async () => {
  router = createBrowserRouter([
    {
      path: '/',
      element: <Layout rootStore={ rootStore } />,
      errorElement: <div />,
      children: [ {
        path: '/auth/:id/callback',
        element: <div />,
        loader: async ({ params }) => {
          console.log(params);
          await rootStore.authenticate(params.id);
  
          return null;
        },
      }, {
        path: '/projects/:id/:tab?',
        element: <RouteProject projects={ rootStore.projectsStore } />,
        loader: async ({ params }) => {
          await rootStore.isReady;
          await rootStore.projectsStore.fetchProject(params.id as IProject['id']);

          if (rootStore.projectsStore.selectedProjectStore) {
            rootStore.projectsStore.selectedProjectStore.selectedTab = params.tab;
          }
  
          return null;
        },
      }, {
        path: '/statistics',
        element: <Statistics statisticsStore={ rootStore.statisticsStore } />,
        loader: async () => {
          await rootStore.isReady;
          await rootStore.statisticsStore.fetch();
  
          return null;
        },
      } ]
    },
  ], {
    basename: '',
  });

  rootStore.setRouter(router);

  const root = ReactDOM.createRoot(document.getElementById('container'));
  
  root.render(<App />);

  rootStore.start();
})();
