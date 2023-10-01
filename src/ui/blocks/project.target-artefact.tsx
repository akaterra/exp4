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

export const ProjectTargetArtifacts = observer(({ projectTarget, key }: { projectTarget?: ProjectTargetStore, key? }) => {
  const [ isShown, setIsShown ] = React.useState(true);

  if (!projectTarget?.target?.id) {
    return null;
  }

  if (!isShown) {
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
      </div>
    </div>;
  }

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
      <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.fetchState() }><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
    </div>
    <div className='paragraph paragraph-lrg'>
      {
        projectTarget.streamsWithStatesAndArtifacts?.some((streamState) => streamState.artifacts?.length)
          ? <div className='table highlighted underlined zebra fine'>
            <div className='row header'>
              <div className='c-4'>Stream</div>
              <div className='c-4'>Artifact</div>
              <div className='c-6'>Artifact value</div>
            </div>
            {
              projectTarget.streamsWithStatesAndArtifacts.map(({ stream, streamState, artifacts }) => {
                if (!artifacts?.length) {
                  return null;
                }

                const lastHistory = streamState.history?.change[0];
    
                return artifacts?.map((artifact, j) => {
                  return <div className='row'>
                    <div className={ lastHistory ? `c-4` : `c-4 opacity-med` }>
                      {
                        j === 0
                          ? <span className={ `span ${streamState._label} overflow` }>
                            { stream.title ?? stream.id }
                              &nbsp;
                            <span className='font-sml sup'>{streamState?.version}</span>
                          </span>
                          : null
                      }
                    </div>
                    <div className={ lastHistory ? 'c-4' : 'c-4 opacity-med' }><span className='overflow'>{ artifact.id }</span></div>
                    <div className={ lastHistory ? 'c-6' : 'c-6 opacity-med' }><ValueMaybeSuccess value={ artifact.description } /></div>
                    <div className='c-4 flex flex-right children-gap-hor'>
                      {
                        j === 0
                          ? <Button
                            className={ `button-sml ${streamState._label ?? ''} w-auto` }
                            x={null}
                            onClick={() => projectTarget.applyTargetStreamDetails(stream.id)}
                          >Info</Button>
                          : null
                      }
                      <Button
                        className={ 'button-sml success w-auto' }
                        x={ null }
                        onClick={ () => projectTarget.projectStore.applyArtifactCopyToClipboard(artifact) }
                      ><i className='fa-solid fa-copy' /></Button>
                    </div>
                  </div>;
                });
              })
            }
          </div>
          : <Label>No artifacts available</Label>
      }
    </div>
  </div>;
});

export const ProjectTargetsArtifacts = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='row'>
    {
      Object.values(project.projectTargetsStores).map((projectTargetStore, i) => {
        return <div className='ccc -s- w00' key={ i }>
          <div className='panel default shadow shadow-low unbound'>
            <ProjectTargetArtifacts projectTarget={ projectTargetStore } key={ 'a' + i } />
          </div>
        </div>;
      })
    }
  </div>;
});
