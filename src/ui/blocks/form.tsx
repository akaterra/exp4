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
  return <Button
    { ...props }
    error={ id ? store.__isError[id] : null }
    id={ id }
    label={ id ? store.__opts[id]?.title ?? props.label : props.label }
    onBlur={ () => store.__validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

export const FormInput = observer(({ store, id, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Input
    { ...props } currentValue={ store[id] ?? '' }
    error={ store.__isError[id] }
    id={ id }
    label={ store.__opts[id]?.title ?? props.label }
    onBlur={ () => store.__validate(id) }
    onChange={ (val) => store.__onChange(id, val) }
  />;
});

export const FormSelect = observer(({ store, id, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Select
    { ...props }
    currentValue={ store[id] }
    id={ id }
    label={ store.__opts[id]?.title ?? props.label }
    onBlur={ () => store.__validate(id) }
    onChange={ (val) => store.__onChange(id, val) }
  />;
});

export const FormSubmit = observer(({ store, id, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button
    { ...props }
    disabled={ false }
    error={ id ? store.__isError[id] : null }
    id={ id }
    label={ id ? store.__opts[id]?.title ?? props.label : props.label }
    preventDefault={ true }
    type='submit'
    onBlur={ () => store.__validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

export const FormSubmitActive = observer(({ store, id, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button
    { ...props }
    disabled={ !store.__isValid }
    error={ id ? store.__isError[id] : null }
    id={ id }
    label={ id ? store.__opts[id]?.title ?? props.label : props.label }
    preventDefault={ true }
    type='submit'
    onBlur={ () => store.__validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

function formOnClick(store: FormStore, cb) {
  store.__validateAll();

  if (store.__isValid && cb) {
    cb();
  }
}
