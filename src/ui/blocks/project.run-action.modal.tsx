import * as React from 'react';
import { IProjectFlowAction, IProjectTarget, ProjectTargetStreamDto } from '../stores/dto/project';
import { ModalStore } from '../stores/modal';
import {Input, Radio} from '../atoms/input';

export const ProjectRunActionModalTitle = ({
  store,
  projectTarget,
  projectTargetActions,
  projectTargetStreams,
}: {
  store: ModalStore;
  projectTarget?: IProjectTarget;
  projectTargetActions?: IProjectFlowAction;
  projectTargetStreams?: ProjectTargetStreamDto[];
}) => {
  return <React.Fragment>
    { projectTargetActions?.title }
    &nbsp;
    <span className='font-sml sup'>{ projectTargetActions?.description }</span>
  </React.Fragment>;
};

export const ProjectRunActionModalContent = ({
  store,
  projectTarget,
  projectTargetActions,
  projectTargetStreams,
}: {
  store: ModalStore;
  projectTarget?: IProjectTarget;
  projectTargetActions?: IProjectFlowAction;
  projectTargetStreams?: ProjectTargetStreamDto[];
}) => {
  let ParamsComponents: React.ReactElement[] | null = null;

  if (projectTargetActions?.params) {
    ParamsComponents = [];

    for (const [ key, param ] of Object.entries(projectTargetActions.params)) {
      switch (param.type) {
        case 'enum':
          if (param.constraints?.enum) {
            for (const enumValue of param.constraints.enum) {
              ParamsComponents.push(<div><Radio x={ null } name={ key }>{ enumValue }</Radio></div>);
            }
          }

          break;

        case 'string':
          ParamsComponents.push(<div><Input label={ param.title ?? key } x={ null} /></div>);
          break;
      }
    }
  }

  return <div className='row'>
    <div className='c18 children-gap'>
      <div>
        Are you sure to run action <span className='bold'>"{ projectTargetActions?.title }"</span> for
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
