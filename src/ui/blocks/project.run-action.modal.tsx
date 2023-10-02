import * as React from 'react';
import { IProjectFlowAction, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ProjectFlowActionParamsStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';
import { FormInput, FormSelect } from './form';

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
        ParamsElements.push(<div>
          <FormSelect
            store={ projectFlowActionParamsStore }
            items={ param.constraints?.enum ?? [] }
            id={ key }
            label={ param.title ?? key }
            x={ null }
          />
        </div>);

        break;

      case 'string':
        ParamsElements.push(<div>
          <FormInput
            store={ projectFlowActionParamsStore }
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
    <div className='flex flex-ver paragraph paragraph children-gap'>
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
  </React.Fragment>

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
