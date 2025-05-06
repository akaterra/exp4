import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
import './main.css';
import './mini.min.css';
import 'normalize.css';
import 'overlayscrollbars/overlayscrollbars.css';
import { Navigation } from './blocks/navigation';
import { ProjectsStore } from './stores/projects';
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
import { Landing } from './blocks/landing';
import { OverlayScrollbarsComponent } from "overlayscrollbars-react";

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
    <div className="container med square">
      <GlobalAlerts />
      <GlobalDetailsPanel />
      <GlobalModal />
    </div>
    <div className='flex flex-ver frame-fixed'>
      <Landing store={ rootStore } />
      <OverlayScrollbarsComponent defer options={{ overflow: { x: 'hidden', y: 'scroll' }, scrollbars: { autoHide: 'leave' } }}>
        <div className='paragraph paragraph-lrg'>
          <div className="container med square pad-hor triple">
            <div className='row'>
              <RouterProvider router={ router } />
            </div>
          </div>
        </div>
      </OverlayScrollbarsComponent>
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
          await rootStore.isReady;
          await rootStore.authorize(params.id);
  
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
