import * as React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Button } from '../atoms/button';
import { ModalStore } from '../stores/modal';

export const ProjectTargetStreamDetailsModalTitle = observer(({
  store,
  projectTarget,
}: {
  store: ModalStore;
  projectTarget?: ProjectTargetStore;
}) => {
  const selectedStreamWithState = projectTarget?.projectStore?.selectedStreamWithState;
  const lastAction = selectedStreamWithState?.streamState?.history?.action?.[0];
  const lastChange = selectedStreamWithState?.streamState?.history?.change?.[0];

  return <React.Fragment>
    { selectedStreamWithState?.stream?.title ?? selectedStreamWithState?.stream?.id }
    &nbsp;
    <span className='font-sml sup'>{ selectedStreamWithState?.streamState?.version } { lastChange ? null : <span className='span warning'>[ OUT ]</span> }</span>
  </React.Fragment>
});

export const ProjectTargetStreamDetailsModalContent = observer(({
  store,
  projectTarget,
}: {
  store: ModalStore;
  projectTarget?: ProjectTargetStore;
}) => {
  const selectedStreamWithState = projectTarget?.projectStore?.selectedStreamWithState;
  const lastAction = selectedStreamWithState?.streamState?.history?.action?.[0];
  const lastChange = selectedStreamWithState?.streamState?.history?.change?.[0];

  return <React.Fragment>
    {
      selectedStreamWithState?.streamState?.link
        ? <a className='link' href={ selectedStreamWithState?.streamState?.link } target='__blank'>{ selectedStreamWithState?.streamState?.type }</a>
        : null
    }
    <div>
      On <span className='bold'>{ projectTarget?.target?.title ?? projectTarget?.target?.id }</span>
    </div>
    {
      selectedStreamWithState?.streamState?.history?.action?.length
        ? <React.Fragment>
          <div>
            <SubSubTitle>Last action</SubSubTitle>
            <Label>{ lastAction?.description ?? 'No description' }</Label>
          </div>
          <a className='link' href={ lastAction?.link } target='__blank'>{ lastAction?.type }</a>
          <div>Author: <a className='link' href={ lastAction?.author?.link }>{ lastAction?.author?.name ?? 'Unknown' }</a></div>
          { lastAction?.time ? <div>At: { new Date(lastAction?.time).toLocaleString() }</div> : null }
        </React.Fragment>
        : null
    }
    {
      selectedStreamWithState?.streamState?.history?.change?.length
        ? <React.Fragment>
          <div>
            <SubSubTitle>Last change</SubSubTitle>
            <Label>{ lastChange?.description ?? 'No description' }</Label>
          </div>
          <a className='link' href={ lastChange?.link } target='__blank'>{ lastChange?.type }</a>
          <div>Author: <a className='link' href={ lastChange?.author?.link }>{ lastChange?.author?.name ?? 'Unknown' }</a></div>
          { lastChange?.time ? <div>At: { new Date(lastChange?.time).toLocaleString() }</div> : null }
        </React.Fragment>
        : null
    }
    <div>
      {
        projectTarget?.actions?.map((action, i) => {
          return <div key={ i }>
            <Button
              className='button-sml success auto'
              x={ null }
              onClick={ () => projectTarget.applyRunAction(selectedStreamWithState?.stream?.id!, action.id) }
            >{ action.title ?? action.id }</Button>
          </div>;
        })
      }
    </div>
  </React.Fragment>;
});
