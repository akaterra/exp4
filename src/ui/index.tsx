/** @jsxImportSource theme-ui */

import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
import type { Theme } from 'theme-ui';
import { Box, Container, Grid, Heading, NavLink, Paragraph, ThemeUIProvider } from 'theme-ui';
import { BG, GAP, P, P_SECTION } from './const';
import { Navigation } from './components/navigation';
import { ProjectsStore } from './stores/projects';

export const theme: Theme = {
  fonts: {
    body: 'system-ui, sans-serif',
    heading: '"Avenir Next", sans-serif',
    monospace: 'Menlo, monospace',
  },
  colors: {
    text: '#000',
    background: '#fff',
    primary: '#33e',
  },
};

export const App = () => (
  <ThemeUIProvider theme={ theme }>
    <Container p={ P } bg={ BG }>
      <Grid gap={ 0 } columns={[ '300px 1fr' ]}>
        <Paragraph p={ P_SECTION }>
          <Navigation store={ projectsStore } />
        </Paragraph>
        <Paragraph p={ P_SECTION }>
          Content
        </Paragraph>
      </Grid>
    </Container>
  </ThemeUIProvider>
);

const projectsStore = new ProjectsStore();

(async () => {
  const root = ReactDOM.createRoot(document.getElementById('container'));
  
  root.render(<App />);

  await projectsStore.fetch();
})();
