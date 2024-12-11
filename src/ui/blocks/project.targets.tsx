import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectStoreMode } from '../stores/project';
import { CheckboxControl, Input } from '../atoms/input';
import { ProjectTargetsStreams } from './project.targets.streams';
import { ProjectTargetsArtifacts } from './project.targets.artifacts';
import { FICTIVE } from '../atoms/utils';
import { ProjectTargetsActionsAndChanges } from './project.targets.actions-and-changes';
import { SubTitle, Title } from '../atoms/title';
import { Tabs } from '../atoms/tabs';
import { Label } from '../atoms/label';

export const ProjectTargets = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  let ModeElement;

  switch (project.mode?.target) {
  case ProjectStoreMode.STREAMS:
    ModeElement = <ProjectTargetsStreams project={ project } />;
    break;
  case ProjectStoreMode.ARTIFACTS:
    ModeElement = <ProjectTargetsArtifacts project={ project } />;
    break;
  case ProjectStoreMode.ACTIONS_AND_CHANGES:
    ModeElement = <ProjectTargetsActionsAndChanges project={ project } />;
    break;
  }

  return <div className='row'>
    <div className='c18 -s-'>
      <Title>{project.project?.title ?? project.project?.id}</Title>
      <SubTitle>Targets</SubTitle>
      <div className='paragraph'>
        <Tabs
          selectedIndex={ project.mode.target }
          tabs={ [
            { id: ProjectStoreMode.STREAMS, title: 'Streams' },
            { id: ProjectStoreMode.ARTIFACTS, title: 'Artifacts' },
            { id: ProjectStoreMode.ACTIONS_AND_CHANGES, title: 'Actions & changes' },
          ] }
          tabsDecoration='default'
          onSelect={ (index, tabId) => project.mode.target = tabId }
        >
        </Tabs>
      </div>
      <div className='row flex flex-end'>
        <Input
          currentValue={ project.filterTargets }
          label='Search'
          placeholder='Space separated :tag / word'
          x={ 'c-6 c-9-s-' }
          onChange={ (value) => project.filterTargets = value }
        />
        <CheckboxControl
          currentValue={ project.filterPlaced }
          label={ FICTIVE }
          x={ 'c-4 c-9-s-' }
          onChange={ (value) => project.filterPlaced = value }
        >Placed</CheckboxControl>
      </div>
    </div>
    <div className='c18'>
      { ModeElement }
    </div>
  </div>;
});
