import * as React from 'react';
import { Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Button } from '../atoms/button';
import { Status } from '../enums/status';
import { InfoCollapsable } from '../atoms/info-collapse';
import { StatusValue, TitledLine } from '../atoms/status-line';
import { IProjectTargetStreamState } from '../stores/dto/project-state';
import { IProjectTargetStream } from '../stores/dto/project';
import { Time } from '../atoms/time';

export const ProjectTargetStreamDetailsModalTitle = observer(({
  // store,
  projectTargetStore,
  projectTargetStream,
  projectTargetStreamState,
}: {
  // store: ModalStore;
  projectTargetStore?: ProjectTargetStore;
  projectTargetStream?: IProjectTargetStream;
  projectTargetStreamState?: IProjectTargetStreamState;
}) => {
  const store = projectTargetStream
    ? projectTargetStore?.projectTargetState?.streams?.[projectTargetStream?.id]
    : null;

  if (store && store?.ver !== projectTargetStreamState?.ver) {
    projectTargetStreamState = store;
  }

  return <div className='flex flex-hor'>
    <div>
      <Title>
        { projectTargetStream?.title ?? projectTargetStream?.id }
        &nbsp;
        <span className='font-sml sup'>{ store?.version }</span>
        {
          store?.isSyncing
            ? <React.Fragment>
              &nbsp;
              <span className='span default font-sml sup'><i className='smaller fa-solid fa-hourglass-start' /></span>
            </React.Fragment>
            : null
        }
      </Title>
    </div>
    <Button
      className='button-sml default transparent w-auto'
      x={null}
      onClick={ () => projectTargetStream?.ref?.targetId ? projectTargetStore?.fetchState(
        [ projectTargetStream?.id ]
      ) : null }
    ><i className="fa-solid fa-arrow-rotate-right fa-rotate-270 fa-lg"></i></Button>
  </div>
});

export const ProjectTargetStreamDetailsModalContent = observer(({
  // store,
  projectTargetStore,
  projectTargetStream,
  projectTargetStreamState,
}: {
  // store: ModalStore;
  projectTargetStore?: ProjectTargetStore;
  projectTargetStream?: IProjectTargetStream;
  projectTargetStreamState?: IProjectTargetStreamState;
}) => {
  const store = projectTargetStream
    ? projectTargetStore?.projectTargetState?.streams?.[projectTargetStream?.id]
    : null;

  if (store && store?.ver !== projectTargetStreamState?.ver) {
    projectTargetStreamState = store;
  }

  const lastAction = projectTargetStreamState?.history?.action?.[0];
  const lastChange = projectTargetStreamState?.history?.change?.[0];

  const isFailed = lastAction?.status === Status.FAILED || lastChange?.status === Status.FAILED;
  const status = isFailed
    ? Status.FAILED
    : lastAction?.status === Status.PROCESSING || lastChange?.status === Status.PROCESSING
      ? Status.PROCESSING
      : Status.SUCCESS;

  return <React.Fragment>
    <div className='flex flex-ver paragraph paragraph-lrg children-gap'>
      <div>
        <a className='link' href={ projectTargetStreamState?.link } target='__blank'>{ projectTargetStreamState?.type ?? 'unknown' }</a>
      </div>
      <div>
        {
          lastChange
            ? <span>In <span className='bold'>{ projectTargetStore?.target?.title ?? projectTargetStore?.target?.id }</span> <StatusValue.Subscription isFailed={ isFailed } status={ status } /></span>
            : <span className='span warning'>Not in <span className='bold'>{ projectTargetStore?.target?.title ?? projectTargetStore?.target?.id }</span></span>
        }
      </div>
    </div>
    {
      lastAction
        ? <div className='flex flex-ver paragraph paragraph-lrg children-gap'>
          <div>
            <div className='caption smallest clear-pt'>Last action <StatusValue.Subscription status={ lastAction.status } /></div>
            <Label>{ lastAction?.description ?? 'No description' }</Label>
          </div>
          <div>
            <a className='link' href={ lastAction?.link } target='__blank'>{ lastAction?.type ?? 'unknown' }</a>
          </div>
          <TitledLine title='Author:'>
            <a className='link' href={ lastAction?.author?.link } target='__blank'>{ lastAction?.author?.name ?? 'unknown' }</a>
          </TitledLine>
          <TitledLine title='At' isShown={ !!lastAction?.time }>
            <Time time={ lastAction?.time } />
          </TitledLine>
          {
            lastAction?.steps && Object.keys(lastAction.steps).length
              ? <InfoCollapsable label={ projectTargetStreamState?._lastActionLabel } showTitle='Info' hideTitle='Hide'>
                <ul className='font-sml'>
                  {
                    Object.values(lastAction?.steps).map((step, i) => <li key={ i }>
                      <a
                        className='link'
                        href={ step.link }
                        target='__blank'
                      >
                        <span className={
                          step.status === Status.FAILED
                            ? 'span failure bold'
                            : step.status === Status.COMPLETED
                              ? 'span success'
                              : step.status === Status.PROCESSING
                                ? 'span warning bold'
                                : 'span default opacity-med'
                        }>{ step.description } { step.runningTimeSeconds ? `[ ${step.runningTimeSeconds} sec. ]` : '' }</span>
                      </a>
                    </li>) }
                </ul>
              </InfoCollapsable>
              : null
          }
        </div>
        : null
    }
    {
      lastChange
        ? <div className='flex flex-ver paragraph paragraph-lrg children-gap'>
          <div>
            <div className='caption smallest clear-pt'>Last change <StatusValue.Subscription status={ lastChange.status } /></div>
            <Label>{ lastChange?.description ?? 'No description' }</Label>
          </div>
          <div>
            <a className='link' href={ lastChange?.link } target='__blank'>{ lastChange?.type ?? 'unknown' }</a>
          </div>
          <TitledLine title='Author:'>
            <a className='link' href={ lastChange?.author?.link } target='__blank'>{ lastChange?.author?.name ?? 'unknown' }</a>
          </TitledLine>
          <TitledLine title='At' isShown={ !!lastChange?.time }>
            <Time time={ lastChange?.time } />
          </TitledLine>
          {
            lastChange?.steps && Object.keys(lastChange.steps).length
              ? <InfoCollapsable isFailed={ isFailed } showTitle='Info' hideTitle='Hide'>
                <ul className='font-sml'>
                  {
                    Object.values(lastChange?.steps).map((step, i) => <li key={ i }>
                      <a
                        className='link'
                        href={ step.link }
                        target='__blank'
                      >
                        <span className={ step.status === Status.FAILED ? 'span failure bold' : 'span success' }>{ step.description }</span>
                      </a>
                    </li>) }
                </ul>
              </InfoCollapsable>
              : null
          }
        </div>
        : null
    }
    {
      projectTargetStreamState?.history?.artifact?.length
        ? <div className='flex flex-ver paragraph paragraph-lrg children-gap'>
          <div className='caption smallest clear-pt'>Artifacts <StatusValue.Subscription status={ projectTargetStreamState._artifactsLabel === 'warning' ? Status.NOT_STABLE : Status.STABLE } /></div>
          {
            projectTargetStreamState?.history?.artifact.map((artifact, i) => {
              return <TitledLine key={ i } title={ `${artifact.id}:` }>
                { artifact.description }
              </TitledLine>
            })
          }
        </div>
        : null
    }
    {
      projectTargetStore?.flowsForStream(projectTargetStream.id)?.length
        ? <div className='flex flex-ver paragraph paragraph-lrg children-gap'>
          <div>
            {
              projectTargetStore?.flowsForStream(projectTargetStream.id)?.map(({ flow, streamIds }, i) => {
                if (
                  flow.ref.targetId && (
                    flow.ref.targetId !== projectTargetStream.ref.targetId ||
                    flow.ref.streamId !== projectTargetStream.id
                  )
                ) {
                  return null;
                }

                return <Button
                  className='button-sml success w-auto'
                  disabled={ streamIds ? !streamIds.length : false }
                  x={ 'w50' }
                  key={ i }
                  onClick={ () => {
                    if (projectTargetStreamState?.id) {
                      projectTargetStore.applyRunFlow(projectTargetStreamState.id, flow.id);
                    }
                  } }
                >{ flow.title ?? flow.id }</Button>;
              })
            }
          </div>
        </div>
        : null
    }
  </React.Fragment>;
});
