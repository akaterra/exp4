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

export const ProjectStatistics = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='paragraph children-gap'>
    <SubTitle>General</SubTitle>
    <div className='list'>
      {
        Object.entries(project?.projectStatistics).map(([ key, val ]) => {
          return <div className='list-item'>
            <TitledLine title={ `${_.startCase(key)}:` }>
              {
                Array.isArray(val) ? null : val
              }
              {
                Array.isArray(val) ? <div className='paragraph paragraph-sml code font-s-m'><div className='ccc'>{ val.map((val) => <div>{ JSON.stringify(val, undefined, 2) }</div>) }</div></div> : null
              }
            </TitledLine>
          </div>;
        })
      }
    </div>
  </div>;    
});
