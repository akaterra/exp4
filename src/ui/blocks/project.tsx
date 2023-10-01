import * as React from 'react';
import { SubTitle, Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Checkbox, Input } from '../atoms/input';
import { Button } from '../atoms/button';
import { InfoCollapse } from '../atoms/info-collapse';
import { Tabs } from '../atoms/tabs';
import { TitledLine, ValueMaybeSuccess } from '../atoms/status-line';
import * as _ from 'lodash';
import {ProjectTargets} from './project.target';
import {ProjectStatistics} from './project.statistics';

export const Project = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div>
    <Title>{project.project?.title ?? project.project?.id}</Title>
    <Label>{project.project?.description ?? 'No description'}</Label>
    <div className='paragraph'>
      <Tabs
        selectedIndex={ project.selectedTab }
        tabs={ [
          { id: 'targets', type: 'link', href: `/projects/${project.project.id}/targets`, title: 'Targets' },
          { id: 'statistics', type: 'link', href: `/projects/${project.project.id}/statistics`, title: 'Statistics' },
        ] }
        tabsDecoration='default'
      >
        <ProjectTargets project={ project } />
        <ProjectStatistics project={ project } />
      </Tabs>
    </div>
  </div>;
});
