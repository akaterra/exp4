import * as React from 'react';
import { SubTitle } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Checkbox } from '../atoms/input';
import { Button } from '../atoms/button';
import { InfoCollapse } from '../atoms/info-collapse';
import { ProjectTargetStreamInfoButton, ProjectTargetStreamTitle } from './project.shared';

export const ProjectTargetStreams = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
  const [ isShown, setIsShown ] = React.useState(true);

  if (!projectTarget?.target?.id) {
    return null;
  }

  const ContentElement = isShown
    ? <React.Fragment>
      <div>
        <InfoCollapse isDisabled={ !projectTarget.streamsWithStates?.length } isIdle={ true } showTitle='Flows'>
          {
            projectTarget.flows.map(({ flow, streamIds }, i) => {
              return <div key={ i }>
                <Button
                  className='button-sml success auto'
                  disabled={ streamIds ? !streamIds.length : false }
                  x={ null }
                  onClick={() => projectTarget.applyRunFlow(null, flow.id)}
                >{ flow.title ?? flow.id }</Button>
              </div>;
            })
          }
        </InfoCollapse>
      </div>
      <div className='paragraph paragraph-lrg'>
        {
          projectTarget.streamsWithStates.map(({ stream, streamState, isSelected }, i) => {
            const lastChange = streamState?.history?.change?.[0];

            return <div key={i} className={ lastChange ? '' : 'opacity-med' }>
              <Checkbox
                currentValue={isSelected}
                onChange={() => projectTarget.applyStreamSelection(stream.id)}
              >
                <div className='overflow'>
                  <ProjectTargetStreamTitle projectTarget={ projectTarget } stream={ stream } streamState={ streamState } />
                </div>
              </Checkbox>
              <ProjectTargetStreamInfoButton projectTarget={ projectTarget } streamState={ streamState } />
            </div>;
          })
        }
      </div>
    </React.Fragment>
    : null;

  return <div className='children-gap span default'>
    <div className='flex flex-hor'>
      <div>
        <SubTitle>
          <a className='link document-color' onClick={ () => setIsShown(!isShown) }>
            { projectTarget.target?.title ?? projectTarget.target?.id }
          </a>
          &nbsp;
          <span className='font-sml sup'>{projectTarget.targetState?.projectTargetState?.version}</span>
        </SubTitle>
        <Label>{projectTarget.target?.description ?? 'No description'}</Label>
      </div>
      <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.fetchStateForMaybeSelectedStreamIds() }><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
    </div>
    { ContentElement }
  </div>;
});

export const ProjectTargetsStreams = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='row'>
    {
      Object.values(project.projectTargetsStores).map((projectTargetStore) => {
        return <div className='ccc -s- w25'>
          <div className='panel default shadow shadow-low unbound'>
            <ProjectTargetStreams projectTarget={projectTargetStore} />
          </div>
        </div>;
      })
    }
  </div>;
});
