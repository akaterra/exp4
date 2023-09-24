import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { DetailsPanel as DetailsPanelAtom } from "../atoms/details-panel";
import { FormStore } from '../stores/form';
import { Button } from '../atoms/button';
import { Input } from '../atoms/input';
import { Select } from '../atoms/select';

export const detailsPanelStore = new ModalStore();

export const FormButton = observer(({ store, id, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button { ...props } key={ id } label={ id ? store.$opts[id]?.title ?? props.label : props.label } onBlur={ () => store.validate(id) } onClick={ () => formOnClick(store, props.onClick) } />;
});

export const FormInput = observer(({ store, id, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Input { ...props } currentValue={ store[id] ?? '' } error={ store.$isError[id] } id={ id } label={ store.$opts[id]?.title ?? props.label } onBlur={ () => store.validate(id) } onChange={ (val) => store.onChange(id, val) } />;
});

export const FormSelect = observer(({ store, id, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Select { ...props } currentValue={ store[id] } id={ id } label={ store.$opts[id]?.title ?? props.label } onBlur={ () => store.validate(id) } onChange={ (val) => store.onChange(id, val) } />;
});

export const FormSubmit = observer(({ store, id, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button { ...props } disabled={ !store.$isValid } key={ id } label={ id ? store.$opts[id]?.title ?? props.label : props.label } onBlur={ () => store.validate(id) } onClick={ () => formOnClick(store, props.onClick) } />;
});

function formOnClick(store: FormStore, cb) {
  store.validateAll();

  if (store.$isValid && cb) {
    cb();
  }
}
