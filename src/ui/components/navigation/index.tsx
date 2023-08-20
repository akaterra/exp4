/** @jsxImportSource theme-ui */

import { observer } from "mobx-react-lite";
import * as ReactDOM from 'react-dom/client';
import * as React from 'react';
import * as UI from 'theme-ui';
import { BG, GAP, P } from '../../const';
import { ProjectsStore } from '../../stores/projects';

export const Navigation = observer(({ store }: { store: ProjectsStore }) => {
  return <div>
    <UI.Grid gap={ 2 } columns={[ '1fr' ]}>
      <UI.NavLink href="#!" p={ 0 }>
        Statistics
      </UI.NavLink>
    </UI.Grid>
    <UI.Heading as='h3' p={ 0 } mt={ 3 } mb={ 3 }>Projects</UI.Heading>
    <UI.Grid gap={ 2 } columns={[ '1fr' ]}>
      {
        store.projectsList.map((e, i) => <UI.NavLink href="#!" p={ 0 } key={ i }>
          { e.id }
        </UI.NavLink>)
      }
    </UI.Grid>
  </div>;
});
