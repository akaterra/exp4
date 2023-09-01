import * as React from 'react';
import { IProjectFlowAction, IProjectTarget, IProjectTargetStream } from '../stores/dto/project';
import { ModalStore } from '../stores/modal';
import {Input, RadioGroup} from '../atoms/input';
import {ProjectFlowActionParamsStore} from '../stores/project';

export const ProjectRunActionModalTitle = ({
  store,
  projectFlowAction,
  projectFlowActionParamsStore,
  projectTarget,
  projectTargetStreams,
}: {
  store: ModalStore;
  projectFlowAction?: IProjectFlowAction;
  projectFlowActionParamsStore?: ProjectFlowActionParamsStore;
  projectTarget?: IProjectTarget;
  projectTargetStreams?: IProjectTargetStream[];
}) => {
  return <React.Fragment>
    { projectFlowAction?.title }
    &nbsp;
    <span className='font-sml sup'>{ projectFlowAction?.description }</span>
  </React.Fragment>;
};

export const ProjectRunActionModalContent = ({
  store,
  projectFlowAction,
  projectFlowActionParamsStore,
  projectTarget,
  projectTargetStreams,
}: {
  store: ModalStore;
  projectFlowAction?: IProjectFlowAction;
  projectFlowActionParamsStore?: ProjectFlowActionParamsStore;
  projectTarget?: IProjectTarget;
  projectTargetStreams?: IProjectTargetStream[];
}) => {
  let ParamsComponents: React.ReactElement[] | null = null;

  if (projectFlowActionParamsStore?.projectFlowAction?.params) {
    ParamsComponents = [];

    for (const [ key, param ] of Object.entries(projectFlowActionParamsStore?.projectFlowAction?.params)) {
      switch (param.type) {
        case 'enum':
          if (param.constraints?.enum) {
            for (const enumValue of param.constraints.enum) {
              ParamsComponents.push(<div><RadioGroup x={ null } name={ key } onBlur={ () => projectFlowActionParamsStore.validate() }>{ enumValue }</RadioGroup></div>);
            }
          }

          break;

        case 'string':
          ParamsComponents.push(<div key={ key }>
            <Input
              currentValue={ projectFlowActionParamsStore.projectFlowActionParams[key] ?? '' }
              error={ projectFlowActionParamsStore.paramsErrors[key] }
              key={ key }
              label={ param.title ?? key }
              x={ null}
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
    <div className='c18 children-gap'>
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
        ParamsComponents
      }
    </div>
  </div>;
};
