import * as React from 'react';
import { Fragment } from 'react';
import { ProjectTargetReleaseParamsStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';
import { FormButton, FormInput, FormSelect, FormTextInput } from './form';
import { Tabs } from '../atoms/tabs';
import { observer } from 'mobx-react-lite';
import { Button } from '../atoms/button';
import { Row } from '../atoms/row';

export const ProjectTargetReleaseModalTitle = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  return <Title>
    { projectTargetStore.target.title ?? projectTargetStore.target.id }&nbsp;
    <span className='font-sml sup'>{projectTargetStore.targetState.version}</span>
    {
      projectTargetStore?.targetState?.isSyncing
        ? <React.Fragment>
          &nbsp;
          <span className='span default font-sml sup'><i className='smaller fa-solid fa-hourglass-start' /></span>
        </React.Fragment>
        : null
    }
  </Title>;
};

export const ProjectTargetReleaseNotesModalContent = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  const ParamsElements: React.ReactElement[] = [];

  projectTargetReleaseParamsStore.state.notes.forEach((note, i) => {
    ParamsElements.push(<div key={ note.id ?? i }>
      <FormTextInput
        store={ projectTargetReleaseParamsStore }
        id={ `notes.${i}.description` }
        label='Description'
        x={ null }
        rows={ 10 }
      />
    </div>);
  });

  return <Fragment>
    <Row>
      <FormInput
        store={ projectTargetReleaseParamsStore }
        id='date'
        label='Date'
        x={ 6 }
        type='datetime-local'
      />
      <FormSelect
        store={ projectTargetReleaseParamsStore }
        id='status'
        items={ { scheduled: 'Scheduled', completed: 'Completed', canceled: 'Canceled' } }
        label='Status'
        x={ 6 }
      />
    </Row>
    {
      ParamsElements
    }
  </Fragment>;
}

export const ProjectTargetReleaseStreamsModalContent = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  if (!projectTargetReleaseParamsStore.state.streams?.length) {
    return <Row><Label>No streams available</Label></Row>;
  }

  const tabs = projectTargetReleaseParamsStore.state.streams.map((stream, i) => ({
    id: String(i),
    title: projectTargetStore.target.streams[stream.id]?.title ?? stream.id,
  }));
  const tabsContents = projectTargetReleaseParamsStore.state.streams.map((stream, i) => <div key={ i }>
    <FormTextInput
      store={ projectTargetReleaseParamsStore }
      id={ `streams.${i}.description` }
      label='Description'
      x={ null }
      rows={ 10 }
    />
  </div>);

  return <Tabs
    selectedIndex={ '0' }
    tabs={ tabs }
    tabsDecoration='default'
  >
    { tabsContents }
  </Tabs>;
}

export const ProjectTargetReleaseOpsModalContent = observer(({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  const ParamsElements: React.ReactElement[] = [];

  projectTargetReleaseParamsStore.state.ops.forEach((op, i) => {
    ParamsElements.push(
      <div key={ op.id ?? i }>
        <Row>
          <FormInput
            store={ projectTargetReleaseParamsStore }
            id={ `ops.${i}.description` }
            label='Description'
            x={ 14 }
            rows={ 2 }
          />
          <FormSelect
            store={ projectTargetReleaseParamsStore }
            id={ `ops.${i}.status` }
            items={ { pending: 'Pending', inProgress: 'In progress', completed: 'Completed', canceled: 'Canceled' } }
            label='Status'
            x={ 4 }
          />
        </Row>
        <div className='flex flex-hor children-gap-hor'>
          {
            projectTargetStore.flows.map(({ flow }, j) => {
              const isSet = op.flows.includes(flow.id);

              return <FormButton
                store={ projectTargetReleaseParamsStore }
                id={ `ops.${i}.flows` }
                key={ `ops.${i}.flows.${j}` }
                className={ isSet ? 'button-sml success w-auto' : 'button-sml default w-auto' }
                x={ null }
                onClick={ () => projectTargetReleaseParamsStore.toggleOpFlow(op, flow.id) }
              >{ flow.title ?? flow.id }</FormButton>;
            })
          }
        </div>
        <div className='flex flex-hor children-gap-hor'>
          <Button
            className='button-sml default w-auto'
            x={ null }
            onClick={ () => projectTargetReleaseParamsStore.addOp(null, i) }
          ><i className="fa-solid fa-plus fa-lg"></i></Button>
          <Button
            className='button-sml default w-auto'
            x={ null }
            onClick={ () => projectTargetReleaseParamsStore.moveOpDown(op) }
          ><i className="fa-solid fa-arrow-down fa-lg"></i></Button>
          <Button
            className='button-sml default w-auto'
            x={ null }
            onClick={ () => projectTargetReleaseParamsStore.moveOpUp(op) }
          ><i className="fa-solid fa-arrow-up fa-lg"></i></Button>
          <Button
            className='button-sml w-auto'
            x={ null }
            onClick={ () => projectTargetReleaseParamsStore.delOp(op) }
          ><i className="fa-solid fa-trash fa-lg"></i></Button>
        </div>
      </div>
    );
  });

  if (projectTargetReleaseParamsStore.state.ops.length === 0) {
    return <div>
      <Button
        className='button-sml default w-auto'
        x={ null }
        onClick={ () => projectTargetReleaseParamsStore.addOp() }
      ><i className="fa-solid fa-plus fa-lg"></i></Button>
    </div>;
  }

  return ParamsElements;
});

export const ProjectTargetReleaseModalContent = observer(({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  return <div className='flex flex-ver paragraph children-gap'>
    <Tabs
      selectedIndex={ 'notes' }
      tabs={ [ { id: 'notes', title: 'Notes' }, { id: 'streams', title: 'Streams' }, { id: 'ops', title: 'Ops' } ] }
      tabsDecoration='default'
    >
      <ProjectTargetReleaseNotesModalContent
        projectTargetReleaseParamsStore={ projectTargetReleaseParamsStore }
        projectTargetStore={ projectTargetStore }
      />
      <ProjectTargetReleaseStreamsModalContent
        projectTargetReleaseParamsStore={ projectTargetReleaseParamsStore }
        projectTargetStore={ projectTargetStore }
      />
      <ProjectTargetReleaseOpsModalContent
        projectTargetReleaseParamsStore={ projectTargetReleaseParamsStore }
        projectTargetStore={ projectTargetStore }
      />
    </Tabs>
  </div>;
});
