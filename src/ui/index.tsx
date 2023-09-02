/** @jsxImportSource theme-ui */

import * as ReactDOM from 'react-dom/client';
import React from 'react';
import './mini.min.css';
import 'normalize.css';
import { Navigation } from './blocks/navigation';
import { ProjectsStore } from './stores/projects';
import { Row } from './atoms/row';
import { Project } from './blocks/project';
import { observer } from 'mobx-react-lite';
import { GlobalModal, Modal, modalStore } from './blocks/modal';
import { GlobalDetailsPanel } from './blocks/details-panel';
import { GlobalAlerts } from './blocks/alerts';
import { RootStore, rootStore } from './stores/root';
import {
  createBrowserRouter,
  Outlet,
  Router,
  RouterProvider,
} from "react-router-dom";
import { IProject } from './stores/dto/project';

const projectsStore = new ProjectsStore();

export const RouteProject = observer(({ projects }: { projects: ProjectsStore }) => {
  return <Project project={ projects.selectedProjectStore } />;
});

export const Layout = observer(({ root }: { root: RootStore }) => {
  return <Row.M>
    <GlobalAlerts />
    <GlobalDetailsPanel />
    <GlobalModal />
    <div className='c-3 -s-'>
      <div className='paragraph paragraph-lrg'>
        <Navigation projects={ projectsStore } root={ root } />
      </div>
    </div>
    <div className='c15 -s-'>
      <div className='paragraph paragraph-lrg'>
        {
          root.isAuthorized
            ? <Outlet />
            : null
        }
      </div>
    </div>
  </Row.M>;
});

const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout root={ rootStore } />,
    // errorElement: <div />,
    children: [ {
      path: '/projects/:id',
      element: <RouteProject projects={ projectsStore } />,
      // errorElement: <div />,
      loader: async ({ request, params }) => {
        projectsStore.selectProject(params.id as IProject['id']);

        return null;
      },
    } ]
  },
], {
  basename: '',
});

export const App = () => {
  return <RouterProvider router={ router } />;
}

(async () => {
  const root = ReactDOM.createRoot(document.getElementById('container'));
  
  root.render(<App />);
})();
