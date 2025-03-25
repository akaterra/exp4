import * as React from 'react';
import { SubTitle, Title } from '../atoms/title';
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
        ? <React.Fragment>
          <SubTitle>General</SubTitle>
          <div className='list'>
            {
              Object.entries(statisticsStore.statistics.general).map(([ key, val ]) => {
                return <div className='list-item'>
                  <TitledLine title={ `${_.startCase(key)}:` }>{ val }</TitledLine>
                </div>;
              })
            }
          </div>
        </React.Fragment>
        : null
    }
    {
      statisticsStore?.statistics.integrations
        ? <React.Fragment>
          <SubTitle>Integrations</SubTitle>
          {
            Object.entries(statisticsStore.statistics.integrations).map(([ key, val ]) => {
              return <div className='list'>
                <div className='list-item bold'>{ key }</div>
                {
                  Object.entries(val).map(([ key, val ]) => {
                    return <div className='list-item sub'>
                      <TitledLine title={ `${_.startCase(key)}:` }>{ val }</TitledLine>
                    </div>;
                  })
                }
              </div>;
            })
          }
        </React.Fragment>
        : null
    }
  </div>;
});
