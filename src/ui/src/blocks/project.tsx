import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { ProjectStore } from '../stores/project';
import { Tabs } from '../atoms/tabs';
import { ProjectTargets } from './project.target';
import { ProjectStatistics } from './project.statistics';

export const Project = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <Tabs
    onlyChild={ true }
    selectedIndex={ project.selectedTab }
    tabs={ [
      { id: 'targets', type: 'link', href: `/projects/${project.project.id}/targets`, title: 'Targets' },
      { id: 'statistics', type: 'link', href: `/projects/${project.project.id}/statistics`, title: 'Statistics' },
    ] }
    tabsDecoration='default'
  >
    <ProjectTargets key={ 0 } project={ project } />
    <ProjectStatistics key={ 1 } project={ project } />
  </Tabs>;
});
