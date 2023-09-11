import * as React from 'react';
import { Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Button } from '../atoms/button';
import { Status } from '../enums/status';
import { InfoCollapse } from '../atoms/info-collapse';
import { StatusLine, TitledLine } from '../atoms/status-line';
import { IProjectTargetStreamState } from '../stores/dto/project-state';
import { IProjectTargetStream } from '../stores/dto/project';

export const ProjectTargetStreamDetailsModalTitle = observer(({
  // store,
  // projectTarget,
  projectTargetStream,
  projectTargetStreamState,
}: {
  // store: ModalStore;
  // projectTarget?: ProjectTargetStore;
  projectTargetStream?: IProjectTargetStream;
  projectTargetStreamState?: IProjectTargetStreamState;
}) => {
  return <div>
    <Title>
      { projectTargetStream?.title ?? projectTargetStream?.id }
      &nbsp;
      <span className='font-sml sup'>{ projectTargetStreamState?.version }</span>
    </Title>
  </div>
});

export const ProjectTargetStreamDetailsModalContent = observer(({
  // store,
  projectTarget,
  // projectTargetStream,
  projectTargetStreamState,
}: {
  // store: ModalStore;
  projectTarget?: ProjectTargetStore;
  // projectTargetStream?: IProjectTargetStream;
  projectTargetStreamState?: IProjectTargetStreamState;
}) => {
  const lastAction = projectTargetStreamState?.history?.action?.[0];
  const lastChange = projectTargetStreamState?.history?.change?.[0];

  const isFailed = lastAction?.status === Status.FAILED || lastChange?.status === Status.FAILED;

  return <React.Fragment>
    {
      projectTargetStreamState?.link
        ? <div><a className='link' href={ projectTargetStreamState?.link } target='__blank'>{ projectTargetStreamState?.type }</a></div>
        : null
    }
    <div>
      {
        lastChange
          ? <span>In <span className='bold'>{ projectTarget?.target?.title ?? projectTarget?.target?.id }</span></span>
          : <span className='span warning'>Not in <span className='bold'>{ projectTarget?.target?.title ?? projectTarget?.target?.id }</span></span>
      }
    </div>
    <StatusLine isFailed={ isFailed } />
    {
      lastAction
        ? <div className='paragraph paragraph-lrg children-gap'>
          <div>
            <div className='caption smallest clear-padding-top'>Last action</div>
            <Label>{ lastAction?.description ?? 'No description' }</Label>
          </div>
          <div>
            <a className='link' href={ lastAction?.link } target='__blank'>{ lastAction?.type }</a>
          </div>
          {
            lastAction?.steps && Object.keys(lastAction.steps).length
              ? <InfoCollapse isFailed={ isFailed } showTitle='Info' hideTitle='Hide'>
                <ul className='font-sml'>
                  {
                    Object.values(lastAction?.steps).map((step) => <li>
                      <a
                        className='link'
                        href={ step.link }
                        target='__blank'
                      >
                        <span className={ step.status === Status.FAILED ? 'span failure bold' : 'span success' }>{ step.description }</span>
                      </a>
                    </li>) }
                </ul>
              </InfoCollapse>
              : null
          }
          <TitledLine title='Author:'>
            <a className='link' href={ lastAction?.author?.link } target='__blank'>{ lastAction?.author?.name ?? 'unknown' }</a>
          </TitledLine>
          <TitledLine title='At' isShown={ !!lastAction?.time }>
            { lastAction?.time ? new Date(lastAction?.time).toLocaleString() : null }
          </TitledLine>
        </div>
        : null
    }
    {
      lastChange
        ? <div className='paragraph paragraph-lrg children-gap'>
          <div>
            <div className='caption smallest clear-padding-top'>Last change</div>
            <Label>{ lastChange?.description ?? 'No description' }</Label>
          </div>
          <div>
            <a className='link' href={ lastChange?.link } target='__blank'>{ lastChange?.type }</a>
          </div>
          {
            lastChange?.steps && Object.keys(lastChange.steps).length
              ? <InfoCollapse isFailed={ isFailed } showTitle='Info' hideTitle='Hide'>
                <ul className='font-sml'>
                  {
                    Object.values(lastChange?.steps).map((step) => <li>
                      <a
                        className='link'
                        href={ step.link }
                        target='__blank'
                      >
                        <span className={ step.status === Status.FAILED ? 'span failure bold' : 'span success' }>{ step.description }</span>
                      </a>
                    </li>) }
                </ul>
              </InfoCollapse>
              : null
          }
          <TitledLine title='Author:'>
            <a className='link' href={ lastChange?.author?.link } target='__blank'>{ lastChange?.author?.name ?? 'unknown' }</a>
          </TitledLine>
          <TitledLine title='At' isShown={ !!lastChange?.time }>
            { lastChange?.time ? new Date(lastChange?.time).toLocaleString() : null }
          </TitledLine>
        </div>
        : null
    }
    {
      projectTargetStreamState?.history?.artifact?.length
        ? <div className='paragraph paragraph-lrg children-gap'>
          <div className='caption smallest clear-padding-top'>Artifacts</div>
          {
            projectTargetStreamState?.history?.artifact.map((artifact) => {
              return <TitledLine title={ `${artifact.id}:` }>
                { artifact.description }
              </TitledLine>
            })
          }
        </div>
        : null
    }
    {
      projectTarget?.actions?.length
        ? <div className='paragraph paragraph-lrg children-gap'>
          <div>
            {
              projectTarget?.actions?.map((action, i) => {
                return <div key={ i }>
                  <Button
                    className='button-sml success auto'
                    x={ null }
                    onClick={ () => {
                      if (projectTargetStreamState?.id) {
                        projectTarget.applyRunAction(projectTargetStreamState.id, action.id)
                      }
                    } }
                  >{ action.title ?? action.id }</Button>
                </div>;
              })
            }
          </div>
        </div>
        : null
    }
  </React.Fragment>;
});
