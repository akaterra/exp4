/** @jsxImportSource theme-ui */

import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
import type { Theme } from 'theme-ui';
import { ThemeUIProvider } from 'theme-ui';

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
    <h1
      sx={{
        color: 'primary',
        fontFamily: 'heading',
      }}
    >
      Hello
    </h1>
  </ThemeUIProvider>
);

const root = ReactDOM.createRoot(document.getElementById('container'));

root.render(<App />);
