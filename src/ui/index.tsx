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

export const App = observer(() => {
  return <Row.M>
    <GlobalAlerts />
    <GlobalDetailsPanel />
    <GlobalModal />
    <div className='c-3 -s-'>
        <div className='paragraph paragraph-lrg'>
          <Navigation projects={ projectsStore } />
        </div>
    </div>
    <div className='c15 -s-'>
      <div className='paragraph paragraph-lrg'>
          <Project project={ projectsStore.selectedProjectStore } />
      </div>
    </div>
    {/* <div className='c15 -s-'>
        <Router>
            <FeedsApp default path="/feeds/:selectedFeedId?" />
            <ProjectsApp path="/projects/:selectedProjectId?" />
            <SubscriptionsApp path="/subscriptions/:selectedProjectUserStateId?" />
            <UsersApp path="/users/:selectedUserId?" />
            <div path="/error">Error!</div>
        </Router>
    </div> */}
  </Row.M>;
});

const projectsStore = new ProjectsStore();

(async () => {
  const root = ReactDOM.createRoot(document.getElementById('container'));
  
  root.render(<App />);

  // await projectsStore.fetch();
})();
