import * as React from 'react';
import { Label } from '../atoms/label';
import { Title } from '../atoms/title';
import { FormInput, FormSelect } from './form';
import { Checkbox } from '../atoms/input';
import { nextSeqId } from '../stores/utils';
import { ProjectFlowParamsStore } from '../stores/project.flow.run.store';
import {Row} from '../atoms/row';

export const ProjectFlowRunModalTitle = ({
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

export const ProjectFlowRunModalContent = ({
  externalStore,
}: {
  externalStore: ProjectFlowParamsStore;
}) => {
  let Elements: React.ReactElement[] | null = null;

  if (externalStore?.schema) {
    Elements = [];

    if (externalStore.projectFlow?.ui) {
      for (const el of externalStore.projectFlow.ui) {
        if (Array.isArray(el)) {
          Elements.push(<div key={ nextSeqId() } className='row flex'>
            { el.map((key) => getControl(externalStore.schema[key], externalStore, key, 'ccc flex-1')) }
          </div>);
        } else {
          Elements.push(getControl(externalStore.schema[el], externalStore, el));
        }
      }
    } else {
      Elements.push(...Object.entries(externalStore.schema).map(([ key, param ], i) => <Row key={ i }>
        { getControl(param, externalStore, key, 18) }
      </Row>));
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
        Elements
      }
    </div>
  </React.Fragment>;
};

function getControl(param, externalStore, key, x = null) {
  switch (param.type) {
  case 'enum':
    return <FormSelect
      store={ externalStore }
      items={ param.constraints?.enum ?? [] }
      id={ key }
      key={ key }
      label={ param.title ?? key }
      x={ x }
    />;
  case 'string':
  case 'value':
    return <FormInput
      store={ externalStore }
      id={ key }
      key={ key }
      label={ param.title ?? key }
      x={ x }
    />;
  }
}
