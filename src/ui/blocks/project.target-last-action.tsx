import * as React from 'react';
import { SubTitle } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Button } from '../atoms/button';
import { ValueMaybeSuccess } from '../atoms/status-line';
import { ProjectTargetStreamInfoButton, ProjectTargetStreamTitle } from './project.shared';
import { Time } from '../atoms/time';

export const ProjectTargetLastActions = observer(({ projectTarget, key }: { projectTarget?: ProjectTargetStore, key? }) => {
  const [ isShown, setIsShown ] = React.useState(true);

  if (!projectTarget?.target?.id) {
    return null;
  }

  const hasActionsOrChanges = projectTarget.streamsWithStatesAndArtifacts?.some((streamState) => streamState.streamState?.history?.action?.length || streamState.streamState?.history?.change?.length);

  const ContentElement = isShown
    ? <React.Fragment>
      <div className='paragraph paragraph-lrg'>
        {
          hasActionsOrChanges
            ? <div className='table highlighted underlined zebra fine'>
              <div className='row header'>
                <div className='ccc w20'>Stream</div>
                <div className='ccc w20'>Action</div>
                <div className='ccc w20'>Change</div>
              </div>
              {
                projectTarget.streamsWithStatesAndArtifacts.map(({ stream, streamState }) => {
                  const actions = streamState?.history?.action?.length
                    ? [ streamState?.history?.action[0] ]
                    : [ null ]

                  const lastChange = streamState.history?.change[0];
      
                  return actions?.map((action, j) => {
                    return <div className='row'>
                      <div className={ lastChange ? `ccc w20` : `ccc w20 opacity-med` }>
                        {
                          j === 0
                            ? <ProjectTargetStreamTitle projectTarget={ projectTarget } stream={ stream } streamState={ streamState } />
                            : null
                        }
                      </div>
                      <div className='ccc w80 flex flex-ver children-gap'>
                        <div className='row'>
                          <div className={ lastChange ? 'ccc w25 flex flex-ver children-gap' : 'ccc w25 opacity-med flex flex-ver children-gap' }>
                            <span className='overflow'>{ action?.description ?? action?.id }</span>
                          </div>
                          <div className={ lastChange ? 'ccc w50' : 'ccc w50 opacity-med' }><ValueMaybeSuccess value={ lastChange?.description } /></div>
                          <div className='ccc w25 flex flex-right children-gap-hor'>
                            {
                              j === 0
                                ? <ProjectTargetStreamInfoButton projectTarget={ projectTarget } streamState={ streamState } />
                                : null
                            }
                            <Button
                              className={ 'button-sml success w-auto' }
                              x={ null }
                              // onClick={ () => projectTarget.projectStore.applyArtifactCopyToClipboard(change) }
                            ><i className='fa-solid fa-copy' /></Button>
                          </div>
                        </div>
                        {
                          action?.time || lastChange?.time
                            ? <div className='row'>
                              <div className='ccc w25'>
                                <div className='label'><Time time={ action?.time } /></div>
                              </div>
                              <div className='ccc w25'>
                                <div className='label'><Time time={ lastChange?.time } /></div>
                              </div>
                            </div>
                            : null
                        }
                      </div>
                    </div>;
                  });
                })
              }
            </div>
            : <Label>No actions or changes available</Label>
        }
      </div>
    </React.Fragment>
    : null;

  return <div className='children-gap span default' key={ key }>
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
      <Button className='button-sml default transparent w-auto' disabled={ !isShown || !hasActionsOrChanges } x={null} onClick={ () => projectTarget.applyActionsAndChangesDownload() }><i className="fa-solid fa-file-arrow-down fa-lg"></i></Button>
      <Button className='button-sml default transparent w-auto' disabled={ !isShown || !hasActionsOrChanges } x={null} onClick={ () => projectTarget.applyActionsAndChangesExportToClipboard() }><i className="fa-solid fa-copy fa-lg"></i></Button>
      <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.fetchStateForMaybeSelectedStreamIds() }><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
    </div>
    { ContentElement }
  </div>;
});

export const ProjectTargetsLastActions = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='row'>
    {
      Object.values(project.projectTargetsStores).map((projectTargetStore, i) => {
        return <div className='ccc -s- w00' key={ i }>
          <div className='panel default shadow shadow-low unbound'>
            <ProjectTargetLastActions projectTarget={ projectTargetStore } key={ 'a' + i } />
          </div>
        </div>;
      })
    }
  </div>;
});
