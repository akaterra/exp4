import * as React from 'react';
import { SubTitle } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Checkbox } from '../atoms/input';
import { Button } from '../atoms/button';
import { InfoCollapsable } from '../atoms/info-collapse';
import { ProjectTargetStreamInfoButton, ProjectTargetStreamTitle } from './project.shared';

export const ProjectTargetStreams = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
  const [ isShown, setIsShown ] = React.useState(true);

  if (!projectTarget?.target?.id) {
    return null;
  }

  const ContentElement = isShown
    ? <React.Fragment>
      <div>
        <InfoCollapsable isDisabled={ !projectTarget.streamsWithStates?.length } isIdle={ true } showTitle='Flows'>
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
        </InfoCollapsable>
      </div>
      <div className='paragraph paragraph-lrg'>
        {
          projectTarget.streamsWithStates.map(({ stream, streamState, isSelected }, i) => {
            const lastChange = streamState?.history?.change?.[0];

            return <div key={ i } className={ lastChange ? '' : 'opacity-med' }>
              <Checkbox
                currentValue={ isSelected }
                x={ null }
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
        <SubTitle title={ projectTarget.target?.description }>
          <a className='link document-color' onClick={ () => setIsShown(!isShown) }>
            { projectTarget.target?.title ?? projectTarget.target?.id }
          </a>
          &nbsp;
          <span className='font-sml sup'>{projectTarget.targetStateStore?.projectTargetState?.version}</span>
        </SubTitle>
      </div>
      {
        projectTarget.target?.versioning
          ? <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.applyRelease() }><i className="fa-solid fa-pen fa-lg"></i></Button>
          : null
      }
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
      Object.values(project.projectTargetsStores).map((projectTargetStore, i) => {
        return <div className='ccc w25 c-9-s-' key={ i }>
          <div className='panel default shadow shadow-low unbound'>
            <ProjectTargetStreams projectTarget={projectTargetStore} />
          </div>
        </div>;
      })
    }
  </div>;
});
