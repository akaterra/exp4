import * as React from 'react';
import { IProjectFlow, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ProjectFlowParamsStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';
import { FormInput, FormSelect } from './form';

export const ProjectRunActionModalTitle = ({
  // store,
  projectFlow,
  // projectFlowActionParamsStore,
  // projectTarget,
  // projectTargetStreams,
}: {
  // store: ModalStore;
  projectFlow?: IProjectFlow;
  // projectFlowActionParamsStore?: ProjectFlowActionParamsStore;
  // projectTarget?: IProjectTarget;
  // projectTargetStreams?: IProjectTargetStream[];
}) => {
  return <div>
    <Title>{ projectFlow?.title ?? projectFlow?.id }</Title>
    {
      projectFlow?.description
        ? <Label>{ projectFlow?.description }</Label>
        : null
    }
  </div>;
};

export const ProjectRunActionModalContent = ({
  // store,
  projectFlow,
  projectFlowParamsStore,
  projectTarget,
  projectTargetStreams,
}: {
  // store: ModalStore;
  projectFlow?: IProjectFlow;
  projectFlowParamsStore?: ProjectFlowParamsStore;
  projectTarget?: IProjectTarget;
  projectTargetStreams?: IProjectTargetStream[];
}) => {
  let ParamsElements: React.ReactElement[] | null = null;

  if (projectFlowParamsStore?.projectFlow?.params) {
    ParamsElements = [];

    for (const [ key, param ] of Object.entries(projectFlowParamsStore?.projectFlow?.params)) {
      switch (param.type) {
      case 'enum':
        ParamsElements.push(<div>
          <FormSelect
            store={ projectFlowParamsStore }
            items={ param.constraints?.enum ?? [] }
            id={ key }
            label={ param.title ?? key }
            x={ null }
          />
        </div>);

        break;

      case 'string':
      case 'value':
        ParamsElements.push(<div>
          <FormInput
            store={ projectFlowParamsStore }
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
          Are you sure to run flow <span className='bold'>"{ projectFlow?.title ?? projectFlow?.id }"</span> for
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
};
