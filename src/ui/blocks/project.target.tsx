import * as React from 'react';
import { observer } from 'mobx-react-lite';
import { ProjectStore } from '../stores/project';
import { Checkbox, CheckboxControl, Input } from '../atoms/input';
import { ProjectTargetsStreams } from './project.target-stream';
import { ProjectTargetsArtifacts } from './project.target-artefact';
import { Select } from '../atoms/select';
import {FICTIVE} from '../atoms/utils';

export const ProjectTargets = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='row'>
    <div className='c18 -s-'>
      <div className='row'>
        <Input
          currentValue={ project.filterTargets }
          label='Search'
          placeholder='Space separated :tag / word'
          x={ 6 }
          onChange={ (value) => project.filterTargets = value }
        />
        <CheckboxControl
          currentValue={ project.filterPlaced }
          label={ FICTIVE }
          x={ 4 }
          onChange={ (value) => project.filterPlaced = value }
        >Placed</CheckboxControl>
        <div className='c-4' />
        <Select
          currentValue={ project.mode.target }
          items={ { stream: 'Streams', artifact: 'Artifacts' } }
          label='Mode'
          x={ 4 }
          onChange={ (value) => {
            console.log({ value });
            project.mode.target = value;
          } }
        />
      </div>
    </div>
    <div className='c18'>
      {
        project.mode?.target === 'stream'
          ? <ProjectTargetsStreams
            project={ project }
          />
          : <ProjectTargetsArtifacts
            project={ project }
          />
      }
    </div>
  </div>;
});
