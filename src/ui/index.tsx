import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
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

export const RouteProject = observer(({ projects }: { projects: ProjectsStore }) => {
  return <Project project={ projects.selectedProjectStore } />;
});

export const Layout = observer(({ rootStore }: { rootStore: RootStore }) => {
  return <React.Fragment>
    <div className='c-3 -s-'>
      <div className='paragraph paragraph-lrg'>
        <Navigation projects={ rootStore.projectsStore } root={ rootStore } />
      </div>
    </div>
    <div className='c15 -s-'>
      <div className='paragraph paragraph-lrg'>
        {
          rootStore.isAuthorized
            ? <Outlet />
            : null
        }
      </div>
    </div>
  </React.Fragment>;
});

let router;

export const App = () => {
  return <Row.M>
    <GlobalAlerts />
    <GlobalDetailsPanel />
    <GlobalModal />
    <RouterProvider router={ router } />
  </Row.M>;
}

(async () => {
  router = createBrowserRouter([
    {
      path: '/',
      element: <Layout rootStore={ rootStore } />,
      errorElement: <div />,
      children: [ {
        path: '/projects/:id/:tab?',
        element: <RouteProject projects={ rootStore.projectsStore } />,
        loader: async ({ params }) => {
          await rootStore.isReady;
          await rootStore.projectsStore.fetchProject(params.id as IProject['id']);

          if (rootStore.projectsStore.selectedProjectStore) {
            switch (params.tab) {
            case 'statistics':
              rootStore.projectsStore.selectedProjectStore.selectedTab = 1;
              break;
            default:
              rootStore.projectsStore.selectedProjectStore.selectedTab = 0;
            }
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

  const root = ReactDOM.createRoot(document.getElementById('container'));
  
  root.render(<App />);

  rootStore.start();
})();
