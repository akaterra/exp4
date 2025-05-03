import * as React from 'react';
import { IProjectFlow, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ProjectFlowParamsStore, ProjectTargetReleaseParamsStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { FormButton, FormInput, FormSelect, FormTextInput } from './form';
import {Tabs} from '../atoms/tabs';
import {observer} from 'mobx-react-lite';
import {Button} from '../atoms/button';

export const ProjectTargetReleaseModalTitle = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  return <div>
    <Title>
      { projectTargetStore.target.title ?? projectTargetStore.target.id }&nbsp;
      <span className='font-sml sup'>{projectTargetStore.targetState.version}</span>
    </Title>
    {
      projectTargetStore.target.description
        ? <Label>{ projectTargetStore.target.description }</Label>
        : null
    }
  </div>;
};

export const ProjectTargetReleaseNotesModalContent = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  const ParamsElements: React.ReactElement[] = [];

  projectTargetReleaseParamsStore.notes.forEach((note, i) => {
    ParamsElements.push(<div>
      <FormTextInput
        store={ projectTargetReleaseParamsStore }
        id={ `notes.${i}` }
        label={ null }
        x={ null }
      />
    </div>);
  });

  return ParamsElements;
}

export const ProjectTargetReleaseComponentsModalContent = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  if (!projectTargetReleaseParamsStore?.__schema) {
    return null;
  }

  const ParamsElements: React.ReactElement[] = [];

  const tabs = projectTargetReleaseParamsStore.streams.map((stream, i) => ({
    id: String(i),
    title: projectTargetStore.target.streams[stream.id].title ?? stream.id,
  }));
  const tabsContents = projectTargetReleaseParamsStore.streams.map((stream, i) => <div key={ i }>
    <FormTextInput
      store={ projectTargetReleaseParamsStore }
      id={ `streams.${i}.description` }
      label={ null }
      x={ null }
    />
  </div>);

  ParamsElements.push(<Tabs
    selectedIndex={ '0' }
    tabs={ tabs }
    tabsDecoration='default'
  >
    { tabsContents }
  </Tabs>);

  return ParamsElements;
}

export const ProjectTargetReleaseOpsModalContent = observer(({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  const ParamsElements: React.ReactElement[] = [];

  projectTargetReleaseParamsStore.ops.forEach((op, i) => {
    ParamsElements.push(
      <div key={ op.id ?? i }>
        <div>
          <FormInput
            store={ projectTargetReleaseParamsStore }
            id={ `ops.${i}.description` }
            key={ null }
            label={ null }
            x={ null }
          />
        </div>
        <div className='flex flex-hor children-gap-hor'>
          {
            projectTargetStore.flows.map(({ flow }, j) => {
              const isSet = op.flows.includes(flow.id);

              return <FormButton
                className={ isSet ? 'button-sml success w-auto' : 'button-sml default w-auto' }
                store={ projectTargetReleaseParamsStore }
                id={ `ops.${i}.flows` }
                key={ null }
                x={ null }
                onClick={ () => {
                  if (isSet) {
                    op.flows = op.flows.filter((flowId) => flowId !== flow.id);
                  } else {
                    op.flows.push(flow.id);
                  }
                } }
              >{ flow.title ?? flow.id }</FormButton>;
            })
          }
        </div>
        <div className='flex flex-hor children-gap-hor'>
          <Button
            className='button-sml w-auto'
            x={ null }
            key={ null }
            onClick={ () => projectTargetReleaseParamsStore.moveOpDown(op) }
          ><i className="fa-solid fa-arrow-down fa-lg"></i></Button>
          <Button
            className='button-sml w-auto'
            x={ null }
            key={ null }
            onClick={ () => projectTargetReleaseParamsStore.moveOpUp(op) }
          ><i className="fa-solid fa-arrow-up fa-lg"></i></Button>
          <Button
            className='button-sml w-auto'
            x={ null }
            key={ null }
            onClick={ () => projectTargetReleaseParamsStore.delOp(op) }
          ><i className="fa-solid fa-trash fa-lg"></i></Button>
          <Button
            className='button-sml w-auto'
            x={ null }
            key={ null }
            onClick={ () => projectTargetReleaseParamsStore.addOp(null, i) }
          ><i className="fa-solid fa-plus fa-lg"></i></Button>
        </div>
      </div>
    );
  });

  if (projectTargetReleaseParamsStore.ops.length === 0) {
    ParamsElements.push(
      <div>
        <Button
          className='button-sml w-auto'
          x={ null }
          onClick={ () => projectTargetReleaseParamsStore.addOp() }
        ><i className="fa-solid fa-plus fa-lg"></i></Button>
      </div>
    );
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
      tabs={ [ { id: 'notes', title: 'Notes' }, { id: 'components', title: 'Components' }, { id: 'ops', title: 'Ops' } ] }
      tabsDecoration='default'
    >
      <ProjectTargetReleaseNotesModalContent
        projectTargetReleaseParamsStore={ projectTargetReleaseParamsStore }
        projectTargetStore={ projectTargetStore }
      />
      <ProjectTargetReleaseComponentsModalContent
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
