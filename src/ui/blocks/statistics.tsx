import * as React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { StatisticsStore } from '../stores/statistics';
import { TitledLine } from '../atoms/status-line';
import * as _ from 'lodash';

export const Statistics = observer(({ statisticsStore }: { statisticsStore?: StatisticsStore }) => {
  return <div className='children-gap'>
    <div>
      <Title>Statistics</Title>
    </div>
    {
      statisticsStore?.statistics.general
        ? <div>
          <SubTitle>General</SubTitle>
          {
            Object.entries(statisticsStore.statistics.general).map(([ key, val ]) => {
              return <TitledLine title={ `${_.startCase(key)}:` }>{ val }</TitledLine>
            })
          }
        </div>
        : null
    }
    {
      statisticsStore?.statistics.projects
        ? <div>
          <SubTitle>Projects</SubTitle>
          {
            Object.entries(statisticsStore.statistics.projects).map(([ key, val ]) => {
              return <React.Fragment>
                <SubSubTitle className='primary'>{ key }</SubSubTitle>
                {
                  Object.entries(val).map(([ key, val ]) => {
                    return <TitledLine title={ `${_.startCase(key)}:` }>{ val }</TitledLine>
                  })
                }
              </React.Fragment>;
            })
          }
        </div>
        : null
    }
  </div>;
});
