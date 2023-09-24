import * as React from 'react';
import { IProjectFlowAction, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { Input } from '../atoms/input';
import { ProjectFlowActionParamsStore } from '../stores/project';
import { Select } from '../atoms/select';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';

export const ProjectRunActionModalTitle = ({
  // store,
  projectFlowAction,
  // projectFlowActionParamsStore,
  // projectTarget,
  // projectTargetStreams,
}: {
  // store: ModalStore;
  projectFlowAction?: IProjectFlowAction;
  // projectFlowActionParamsStore?: ProjectFlowActionParamsStore;
  // projectTarget?: IProjectTarget;
  // projectTargetStreams?: IProjectTargetStream[];
}) => {
  return <div>
    <Title>{ projectFlowAction?.title }</Title>
    {
      projectFlowAction?.description
        ? <Label>{ projectFlowAction?.description }</Label>
        : null
    }
  </div>;
};

export const ProjectRunActionModalContent = ({
  // store,
  projectFlowAction,
  projectFlowActionParamsStore,
  projectTarget,
  projectTargetStreams,
}: {
  // store: ModalStore;
  projectFlowAction?: IProjectFlowAction;
  projectFlowActionParamsStore?: ProjectFlowActionParamsStore;
  projectTarget?: IProjectTarget;
  projectTargetStreams?: IProjectTargetStream[];
}) => {
  let ParamsElements: React.ReactElement[] | null = null;

  if (projectFlowActionParamsStore?.projectFlowAction?.params) {
    ParamsElements = [];

    for (const [ key, param ] of Object.entries(projectFlowActionParamsStore?.projectFlowAction?.params)) {
      switch (param.type) {
      case 'enum':
        ParamsElements.push(<div key={ key }>
          <Select
            items={ param.constraints?.enum ?? [] } currentValue={ projectFlowActionParamsStore.paramsValues[key] ?? '' }
            error={ projectFlowActionParamsStore.paramsErrors[key] }
            key={ key }
            label={ param.title ?? key }
            x={ null }
            onBlur={ (val) => {
              projectFlowActionParamsStore.setValue(key, val);
              projectFlowActionParamsStore.validate();
            } }
            onChange={ _ => _ }
          />
        </div>);

        break;

      case 'string':
        ParamsElements.push(<div key={ key }>
          <Input
            currentValue={ projectFlowActionParamsStore.paramsValues[key] ?? '' }
            error={ projectFlowActionParamsStore.paramsErrors[key] }
            key={ key }
            label={ param.title ?? key }
            x={ null }
            onBlur={ (val) => {
              projectFlowActionParamsStore.setValue(key, val);
              projectFlowActionParamsStore.validate();
            } }
            onChange={ _ => _ }
          />
        </div>);

        break;
      }
    }
  }

  return <div className='row'>
    <div className='c18 flex flex-ver children-gap'>
      <div>
        Are you sure to run action <span className='bold'>"{ projectFlowAction?.title }"</span> for
        <ul>
          {
            projectTargetStreams?.map((stream) => <li>{ stream.title ?? stream.id }</li>)
          }
        </ul>
        on <span className='bold'>{ projectTarget?.title ?? projectTarget?.id }</span>?
      </div>
      {
        ParamsElements
      }
    </div>
  </div>;
};
