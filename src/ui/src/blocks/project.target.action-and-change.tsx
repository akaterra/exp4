import * as React from 'react';
import { SubTitle } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Button } from '../atoms/button';
import { ValueMaybeSuccess } from '../atoms/status-line';
import { ProjectTargetStreamInfoButton, ProjectTargetStreamTitle } from './project.shared';
import { Time } from '../atoms/time';

export const ProjectTargetActionsAndChanges = observer(({ projectTarget, key }: { projectTarget?: ProjectTargetStore, key? }) => {
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
            ? <table className='table highlighted underlined zebra fine'><tbody>
              <tr className='header'>
                <th className='w20'>Stream</th>
                <th className='w20'>Action</th>
                <th className='w20'>Change</th>
              </tr>
              {
                projectTarget.streamsWithStatesAndArtifacts.map(({ stream, streamState }) => {
                  const actions = streamState?.history?.action?.length
                    ? [ streamState?.history?.action[0] ]
                    : [ null ]

                  const lastChange = streamState.history?.change[0];
      
                  return actions?.map((action, j) => {
                    return <tr>
                      <td className={ lastChange ? `w20` : `w20 opacity-med` }>
                        {
                          j === 0
                            ? <ProjectTargetStreamTitle projectTarget={ projectTarget } stream={ stream } streamState={ streamState } />
                            : null
                        }
                      </td>
                      <td className='w80 block children-gap'>
                        <div className='row'>
                          <div className={ lastChange ? 'ccc w25 flex flex-ver' : 'ccc w25 flex flex-ver opacity-med' }>
                            <span className='overflow'>{ action?.description ?? action?.id }</span>
                          </div>
                          <div className={ lastChange ? 'ccc w50 flex flex-ver' : 'ccc w50 flex flex-ver opacity-med' }>
                            <ValueMaybeSuccess value={ lastChange?.description } />
                          </div>
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
                      </td>
                    </tr>;
                  });
                })
              }
            </tbody></table>
            : <Label>No actions or changes available</Label>
        }
      </div>
    </React.Fragment>
    : null;

  return <div className='children-gap span default' key={ key }>
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
      <Button className='button-sml default transparent w-auto' disabled={ !isShown || !hasActionsOrChanges } x={null} onClick={ () => projectTarget.applyActionsAndChangesDownload() }><i className="fa-solid fa-file-arrow-down fa-lg"></i></Button>
      <Button className='button-sml default transparent w-auto' disabled={ !isShown || !hasActionsOrChanges } x={null} onClick={ () => projectTarget.applyActionsAndChangesExportToClipboard() }><i className="fa-solid fa-copy fa-lg"></i></Button>
      <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.fetchStateForMaybeSelectedStreamIds() }><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
    </div>
    { ContentElement }
  </div>;
});

export const ProjectTargetsActionsAndChanges = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='row'>
    {
      Object.values(project.projectTargetsStores).map((projectTargetStore, i) => {
        return <div className='ccc -s- w00' key={ i }>
          <div className='panel default shadow shadow-low unbound'>
            <ProjectTargetActionsAndChanges projectTarget={ projectTargetStore } key={ 'a' + i } />
          </div>
        </div>;
      })
    }
  </div>;
});
