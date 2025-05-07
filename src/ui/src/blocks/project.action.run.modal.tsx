import * as React from 'react';
import { IProjectFlow, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ProjectFlowParamsStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';
import { FormInput, FormSelect } from './form';
import {Checkbox} from '../atoms/input';
import {ProjectTargetStreamTitle} from './project.shared';

export const ProjectActionRunModalTitle = ({
  externalStore,
}: {
  externalStore: ProjectFlowParamsStore;
}) => {
  return <div>
    <Title>{ externalStore.projectFlow?.title ?? externalStore.projectFlow?.id }</Title>
    {
      externalStore.projectFlow?.description
        ? <Label>{ externalStore.projectFlow?.description }</Label>
        : null
    }
  </div>;
};

export const ProjectActionRunModalContent = ({
  externalStore,
}: {
  externalStore: ProjectFlowParamsStore;
}) => {
  let ParamsElements: React.ReactElement[] | null = null;

  if (externalStore?.__schema) {
    ParamsElements = [];

    for (const [ key, param ] of Object.entries(externalStore.__schema)) {
      switch (param.type) {
      case 'enum':
        ParamsElements.push(<div key={ key }>
          <FormSelect
            store={ externalStore }
            items={ param.constraints?.enum ?? [] }
            id={ key }
            label={ param.title ?? key }
            x={ null }
          />
        </div>);

        break;

      case 'string':
      case 'value':
        ParamsElements.push(<div key={ key }>
          <FormInput
            store={ externalStore }
            id={ key }
            label={ param.title ?? key }
            x={ null }
          />
        </div>);

        break;
      }
    }
  }

  return <React.Fragment>
    <div className='flex flex-ver paragraph children-gap'>
      <div>
        Confirm flow running <span className='bold'>"{ externalStore.projectFlow?.title ?? externalStore.projectFlow?.id }"</span> for
        <div className='row paragraph'>
          {
            externalStore.projectTargetStreams?.map((stream, i) => <Checkbox
              currentValue={ stream.isSelected }
              key={ i }
              x={ 9 }
              onChange={ () => stream.isSelected = !stream.isSelected }
            >
              <div className='overflow'>
                { stream.title ?? stream.id }
              </div>
            </Checkbox>)
          }
        </div>
        on <span className='bold'>{ externalStore.projectTarget?.title ?? externalStore.projectTarget?.id }</span>
      </div>
      {
        ParamsElements
      }
    </div>
  </React.Fragment>;
};
