import * as React from 'react';
import { Fragment } from 'react';
import { ProjectTargetReleaseParamsStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';
import { FormInput, FormSelect, FormTextInput } from './form';
import { Tabs } from '../atoms/tabs';
import { observer } from 'mobx-react-lite';
import { Button } from '../atoms/button';
import { Row } from '../atoms/row';
import { nextSeqId } from '../stores/utils';

export const StreamArtifactLineControlPanel = ({ store, stream, i }: { store: ProjectTargetReleaseParamsStore, stream, i: number }) => {
  return <div className='flex flex-hor children-gap-hor'>
    <Button
      className='button-sml default w-auto'
      x={ null }
      onClick={ () => store.streamArtifactAdd(stream, null, i) }
    ><i className="fa-solid fa-plus fa-lg"></i></Button>
    <Button
      className='button-sml default w-auto'
      x={ null }
      onClick={ () => store.streamArtifactMoveUp(stream, i) }
    ><i className="fa-solid fa-arrow-down fa-lg"></i></Button>
    <Button
      className='button-sml default w-auto'
      x={ null }
      onClick={ () => store.streamArtifactMoveDown(stream, i) }
    ><i className="fa-solid fa-arrow-up fa-lg"></i></Button>
    <Button
      className='button-sml w-auto'
      x={ null }
      onClick={ () => store.streamArtifactDel(stream, i) }
    ><i className="fa-solid fa-trash fa-lg"></i></Button>
  </div>
}

export const OpLineControlPanel = ({ store, op, i }: { store: ProjectTargetReleaseParamsStore, op, i: number }) => {
  return <div className='flex flex-hor children-gap-hor'>
    <Button
      className='button-sml default w-auto'
      x={ null }
      onClick={ () => store.opAdd(null, i) }
    ><i className="fa-solid fa-plus fa-lg"></i></Button>
    <Button
      className='button-sml default w-auto'
      x={ null }
      onClick={ () => store.opMoveDown(op) }
    ><i className="fa-solid fa-arrow-down fa-lg"></i></Button>
    <Button
      className='button-sml default w-auto'
      x={ null }
      onClick={ () => store.opMoveUp(op) }
    ><i className="fa-solid fa-arrow-up fa-lg"></i></Button>
    <Button
      className='button-sml w-auto'
      x={ null }
      onClick={ () => store.opDel(i) }
    ><i className="fa-solid fa-trash fa-lg"></i></Button>
  </div>
}

export const ProjectTargetReleaseModalTitle = ({
  externalStore,
}: {
  externalStore: ProjectTargetReleaseParamsStore;
}) => {
  return <Title>
    { externalStore.projectTarget.title ?? externalStore.projectTarget.id }&nbsp;
    <span className='font-sml sup'>{externalStore.projectTargetStore.targetState.version}</span>
    {
      externalStore.projectTargetStore.targetState?.isSyncing
        ? <React.Fragment>
          &nbsp;
          <span className='span default font-sml sup'><i className='smaller fa-solid fa-hourglass-start' /></span>
        </React.Fragment>
        : null
    }
  </Title>;
};

export const ProjectTargetReleaseNotesModalContent = observer(({
  externalStore,
}: {
  externalStore: ProjectTargetReleaseParamsStore;
}) => {
  return <Fragment>
    {
      externalStore.state.notes.map((note, i) => <div key={ note.id ?? i }>
        <FormTextInput
          store={ externalStore }
          id={ `notes.${i}.description` }
          label={ i === 0 ? 'Description' : null }
          x={ null }
          rows={ 10 }
        />
      </div>)
    }
    <Row>
      <FormInput
        store={ externalStore }
        id='date'
        label='Date'
        x={ 'c-6 c-9-s-' }
        type='datetime-local'
      />
      <FormSelect
        store={ externalStore }
        id='status'
        items={ { scheduled: 'Scheduled', completed: 'Completed', canceled: 'Canceled' } }
        label='Status'
        x={ 'c-6 c-9-s-' }
      />
    </Row>
  </Fragment>;
});

export const ProjectTargetReleaseStreamsModalContent = observer(({
  externalStore,
}: {
  externalStore: ProjectTargetReleaseParamsStore;
}) => {
  if (!externalStore.state.streams?.length) {
    return <Label>No streams available</Label>;
  }

  const tabs = externalStore.state.streams.map((stream, i) => ({
    id: String(i),
    title: externalStore.projectTarget.streams[stream.id]?.title ?? stream.id,
  }));
  const tabsContents = externalStore.state.streams.map((stream, i) => <Fragment key={ i }>
    <div>
      <FormTextInput
        store={ externalStore }
        id={ `streams.${i}.description` }
        label='Description'
        x={ null }
        rows={ 10 }
      />
    </div>
    {
      !stream.artifacts.length
        ? <div key={ 0 }><Button
          className='button-sml default w-auto'
          label='No artifacts available'
          x={ null }
          onClick={ () => externalStore.streamArtifactAdd(stream) }
        ><i className="fa-solid fa-plus fa-lg"></i></Button></div>
        : stream.artifacts.map((artifact, j) => <div key={ nextSeqId() }>
          <Row>
            <FormInput
              store={ externalStore }
              id={ `streams.${i}.artifacts.${j}.id` }
              label={ j === 0 ? 'Artifact ID' : null }
              x={ 'c-6 c-9-s-' }
            />
            <FormInput
              store={ externalStore }
              id={ `streams.${i}.artifacts.${j}.description` }
              label={ j === 0 ? 'Artifact value' : null }
              x={ 'c-6 c-9-s-' }
            />
          </Row>
          <StreamArtifactLineControlPanel
            store={ externalStore }
            stream={ stream }
            i={ j }
          />
        </div>)
    }
  </Fragment>);

  return <Tabs
    selectedIndex={ '0' }
    tabs={ tabs }
    tabsDecoration='default'
  >
    { tabsContents }
  </Tabs>;
});

export const ProjectTargetReleaseOpsModalContent = observer(({
  externalStore,
}: {
  externalStore: ProjectTargetReleaseParamsStore;
}) => {
  if (externalStore.state.ops.length === 0) {
    return <div>
      <Button
        className='button-sml default w-auto'
        label='No ops available'
        x={ null }
        onClick={ () => externalStore.opAdd() }
      ><i className="fa-solid fa-plus fa-lg"></i></Button>
    </div>;
  }

  return externalStore.state.ops.map((op, i) => <div key={ op.id ?? i }>
    <Row>
      <FormInput
        id={ `ops.${i}.description` }
        label={ i === 0 ? 'Description' : null }
        rows={ 2 }
        store={ externalStore }
        x={ 'c10 c10-s-' }
      />
      <FormSelect
        id={ `ops.${i}.metadata.streamId` }
        items={ externalStore.streamsForSelect }
        label={ i === 0 ? 'Stream' : null }
        store={ externalStore }
        x={ 'c-4 c-4-s-' }
      />
      <FormSelect
        id={ `ops.${i}.status` }
        items={ { pending: 'Pending', inProgress: 'In progress', completed: 'Completed', canceled: 'Canceled' } }
        label={ i === 0 ? 'Status' : null }
        store={ externalStore }
        x={ 'c-4 c-4-s-' }
      />
    </Row>
    <div className='flex flex-hor children-gap-hor'>
      {
        externalStore.projectTargetStore.flows.map(({ flow }, j) => {
          const isSet = op.flows.includes(flow.id);

          return <Button
            className={ isSet ? 'button-sml success w-auto' : 'button-sml default w-auto' }
            key={ `ops.${i}.flows.${j}` }
            store={ externalStore }
            x={ null }
            onClick={ () => externalStore.opToggleFlow(op, flow.id) }
          >{ flow.title ?? flow.id }</Button>;
        })
      }
    </div>
    <OpLineControlPanel
      store={ externalStore }
      op={ op }
      i={ i }
    />
  </div>);
});

export const ProjectTargetReleaseModalContent = observer(({
  externalStore,
}: {
  externalStore: ProjectTargetReleaseParamsStore;
}) => {
  return <div className='flex flex-ver paragraph children-gap'>
    <Tabs
      selectedIndex={ 'notes' }
      tabs={ [ { id: 'notes', title: 'Notes' }, { id: 'streams', title: 'Streams' }, { id: 'ops', title: 'Ops' } ] }
      tabsDecoration='default'
    >
      <ProjectTargetReleaseNotesModalContent externalStore={ externalStore } />
      <ProjectTargetReleaseStreamsModalContent externalStore={ externalStore } />
      <ProjectTargetReleaseOpsModalContent externalStore={ externalStore } />
    </Tabs>
  </div>;
});
