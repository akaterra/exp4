/** @jsxImportSource theme-ui */

import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
import * as UI from 'theme-ui';
import { BG, GAP, P } from '../../const';

export const Navigation = () => (
  <div>
    <UI.Grid gap={ 2 } columns={[ '1fr' ]}>
      <UI.NavLink href="#!" p={ 0 }>
        Statistics
      </UI.NavLink>
    </UI.Grid>
    <UI.Heading as='h3' p={ 0 } mt={ 3 } mb={ 3 }>Projects</UI.Heading>
    <UI.Grid gap={ 2 } columns={[ '1fr' ]}>
      <UI.NavLink href="#!" p={ 0 }>
        Test 1
      </UI.NavLink>
      <UI.NavLink href="#!" p={ 0 }>
        Test 2
      </UI.NavLink>
    </UI.Grid>
  </div>
);
