import * as React from 'react';
import { IProjectFlow, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ProjectFlowParamsStore, ProjectTargetReleaseParamsStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { FormButton, FormInput, FormSelect, FormTextInput } from './form';
import {Tabs} from '../atoms/tabs';
import {observer} from 'mobx-react-lite';

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
  const ParamsElements: React.ReactElement[] = [
    <SubSubTitle>Notes</SubSubTitle>,
  ];

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

  const ParamsElements: React.ReactElement[] = [
    <SubSubTitle>Components</SubSubTitle>,
  ];

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
  const ParamsElements: React.ReactElement[] = [
    <SubSubTitle>Ops</SubSubTitle>,
  ];

  projectTargetReleaseParamsStore.ops.forEach((op, i) => {
    ParamsElements.push(<div>
      <FormInput
        store={ projectTargetReleaseParamsStore }
        id={ `ops.${i}.description` }
        label={ null }
        x={ null }
      />
    </div>, <div>
      {
        projectTargetStore.flows.map(({ flow }, j) => {
          const isSet = op.flows.includes(flow.id);

          return <FormButton
            className={ isSet ? 'button-sml success w-auto' : 'button-sml default w-auto' }
            store={ projectTargetReleaseParamsStore }
            id={ `ops.${i}.flows` }
            x={ 'w50' }
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
    </div>);
  });

  return ParamsElements;
});

export const ProjectTargetReleaseModalContent = observer(({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  return <React.Fragment>
    <div className='flex flex-ver paragraph children-gap'>
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
    </div>
  </React.Fragment>;
});
