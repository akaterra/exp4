import * as React from 'react';
import { IProjectFlow, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ProjectFlowParamsStore, ProjectTargetReleaseParamsStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { FormInput, FormSelect, FormTextInput } from './form';
import {Tabs} from '../atoms/tabs';

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

export const ProjectTargetReleaseModalContent = ({
  projectTargetReleaseParamsStore,
  projectTargetStore,
}: {
  projectTargetReleaseParamsStore?: ProjectTargetReleaseParamsStore;
  projectTargetStore?: ProjectTargetStore;
}) => {
  let ParamsElements: React.ReactElement[] | null = null;

  if (projectTargetReleaseParamsStore?.__schema) {
    ParamsElements = [];

    ParamsElements.push(<SubSubTitle>Notes</SubSubTitle>);

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

    ParamsElements.push(<SubSubTitle>Components</SubSubTitle>);

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
  }

  return <React.Fragment>
    <div className='flex flex-ver paragraph children-gap'>
      {
        ParamsElements
      }
    </div>
  </React.Fragment>;
};
