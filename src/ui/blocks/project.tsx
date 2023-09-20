import * as React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Checkbox, Input } from '../atoms/input';
import { Button } from '../atoms/button';
import { InfoCollapse } from '../atoms/info-collapse';
import { Tabs } from '../atoms/tabs';
import { TitledLine, ValueMaybeSuccess } from '../atoms/status-line';
import * as _ from 'lodash';

export const ProjectTarget = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
  const [ isShown, setIsShown ] = React.useState(true);

  if (!projectTarget?.target?.id) {
    return null;
  }

  if (!isShown) {
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
        <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.fetchState() }><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
      </div>
    </div>;
  }

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
      <Button className='button-sml default transparent w-auto' x={null} onClick={ () => projectTarget.fetchState() }><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
    </div>
    <div>
      <InfoCollapse isIdle={ true } showTitle='Actions'>
        {
          projectTarget.actions.map(({ action, streamIds }, i) => {
            return <div key={ i }>
              <Button
                className='button-sml success auto'
                disabled={ streamIds ? !streamIds.length : false }
                x={ null }
                onClick={() => projectTarget.applyRunAction(null, action.id)}
              >{ action.title ?? action.id }</Button>
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
              <div className={ `span ${ streamState._label } overflow` }>
                { stream.title ?? stream.id }
                &nbsp;
                <span className='font-sml sup'>{ streamState?.version }</span>
              </div>
            </Checkbox>
            <Button
              className={ `button-sml ${streamState._label ?? ''} w-auto` }
              x={null}
              onClick={() => projectTarget.applyTargetStreamDetails(stream.id)}
            >Info</Button>
          </div>;
        })
      }
    </div>
  </div>;
});

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

export const ProjectTargets = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div className='row paragraph1'>
    <div className='c18 -s-'>
      <div className='row'>
        <Input currentValue={ project.filterTargets } label='Search' x={ 6 } placeholder='Space separated :tag / word' onChange={ (value) => project.filterTargets = value } />
      </div>
    </div>
    {
      Object.values(project.projectTargetsStores).map((projectTargetStore) => {
        return <div className='ccc -s- w25'>
          <div className='panel default shadow shadow-low unbound'>
            <ProjectTarget projectTarget={projectTargetStore} />
          </div>
        </div>;
      })
    }
  </div>;
});

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
              projectTarget.streamsWithStatesAndArtifacts.map(({ stream, streamState, artifacts }, i) => {
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

  return <div className='row paragraph1'>
    <div className='c18 -s-'>
      <div className='row'>
        <Input currentValue={ project.filterTargetsArtifacts } label='Search' x={ 6 } placeholder='Space separated :tag / word' onChange={ (value) => project.filterTargetsArtifacts = value } />
      </div>
    </div>
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

export const Project = observer(({ project }: { project?: ProjectStore }) => {
  if (!project?.project?.id) {
    return null;
  }

  return <div>
    <Title>{project.project?.title ?? project.project?.id}</Title>
    <Label>{project.project?.description ?? 'No description'}</Label>
    <div className='paragraph'>
      <Tabs
        selectedIndex={ project.selectedTab }
        tabs={ [
          { id: 'targets', type: 'link', href: `/projects/${project.project.id}/targets`, title: 'Targets' },
          { id: 'targetsArtifacts', type: 'link', href: `/projects/${project.project.id}/targetsArtifacts`, title: 'Targets artifacts' },
          { id: 'statistics', type: 'link', href: `/projects/${project.project.id}/statistics`, title: 'Statistics' },
        ] }
        tabsDecoration='default'
      >
        <ProjectTargets project={ project } />
        <ProjectTargetsArtifacts project={ project } />
        <ProjectStatistics project={ project } />
      </Tabs>
    </div>
  </div>;
});
