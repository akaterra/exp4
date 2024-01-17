import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { ProjectStore } from '../stores/project';
import { CheckboxControl, Input } from '../atoms/input';
import { ProjectTargetsStreams } from './project.target-stream';
import { ProjectTargetsArtifacts } from './project.target-artifact';
import { Select } from '../atoms/select';
import { FICTIVE } from '../atoms/utils';
import { ProjectTargetsLastActions } from './project.target-last-action';

export const ProjectTargets = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  let ModeElement;

  switch (project.mode?.target) {
  case 'artifact':
    ModeElement = <ProjectTargetsArtifacts project={ project } />;
    break;
  case 'lastAction':
    ModeElement = <ProjectTargetsLastActions project={ project } />;
    break;
  case 'stream':
    ModeElement = <ProjectTargetsStreams project={ project } />;
    break;
  }

  return <div className='row'>
    <div className='c18 -s-'>
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
        <div className='c-4 show-med show-lrg' />
        <Select
          currentValue={ project.mode.target }
          items={ { stream: 'Streams', artifact: 'Artifacts', 'lastAction': 'Actions & changes' } }
          label='Show'
          x={ 'c-4 c-9-s-' }
          onChange={ (value) => {
            console.log({ value });
            project.mode.target = value;
          } }
        />
      </div>
    </div>
    <div className='c18'>
      { ModeElement }
    </div>
  </div>;
});
