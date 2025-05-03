import * as React from 'react-dom';
import { Fragment } from 'react';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { FormStore } from '../stores/form';
import { Button } from '../atoms/button';
import { Input } from '../atoms/input';
import { Select } from '../atoms/select';
import { Textarea } from '../atoms/textarea';

export const detailsPanelStore = new ModalStore();

export const FormButton = observer(({ store, id, subId, ...props }: { store: FormStore; id?: string; subId?: number | string; key?: string } & Record<string, unknown>) => {
  return <Button
    { ...props }
    error={ id ? store.isError[id] : null }
    key={ subId ? `${id}.${subId}` : id }
    label={ id ? store.__schema[id]?.title ?? props.label : props.label }
    onBlur={ () => store.validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

export const FormInput = observer(({ store, id, subId, ...props }: { store: FormStore, id: string; subId?: number } & Record<string, unknown>) => {
  return <Input
    { ...props } currentValue={ store.get(id) ?? '' }
    error={ store.isError[id] }
    key={ subId ? `${id}.${subId}` : id }
    label={ store.__schema[id]?.title ?? props.label }
    onBlur={ () => store.validate(id) }
    onChange={ (val) => store.onChange(id, val) }
  />;
});

export const FormTextInput = observer(({ store, id, subId, ...props }: { store: FormStore, id: string; subId?: number } & Record<string, unknown>) => {
  return <Textarea
    { ...props } currentValue={ store.get(id) ?? '' }
    error={ store.isError[id] }
    key={ subId ? `${id}.${subId}` : id }
    label={ store.__schema[id]?.title ?? props.label }
    onBlur={ () => store.validate(id) }
    onChange={ (val) => store.onChange(id, val) }
  />;
});

export const FormSelect = observer(({ store, id, subId, ...props }: { store: FormStore, id: string; subId?: number } & Record<string, unknown>) => {
  return <Select
    { ...props } currentValue={ store.get(id) }
    error={ store.isError[id] }
    key={ subId ? `${id}.${subId}` : id }
    label={ store.__schema[id]?.title ?? props.label }
    onBlur={ () => store.validate(id) }
    onChange={ (val) => store.onChange(id, val) }
  />;
});

export const FormSubmit = observer(({ store, id, subId, ...props }: { store: FormStore, id?: string; subId?: number } & Record<string, unknown>) => {
  return <Button
    { ...props }
    disabled={ false }
    error={ id ? store.isError[id] : null }
    key={ subId ? `${id}.${subId}` : id }
    label={ id ? store.__schema[id]?.title ?? props.label : props.label }
    preventDefault={ true }
    type='submit'
    onBlur={ () => store.validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

export const FormSubmitActive = observer(({ store, id, subId, ...props }: { store: FormStore, id?: string; subId?: number } & Record<string, unknown>) => {
  return <Button
    { ...props }
    disabled={ !store.isValid }
    error={ id ? store.isError[id] : null }
    key={ subId ? `${id}.${subId}` : id }
    label={ id ? store.__schema[id]?.title ?? props.label : props.label }
    preventDefault={ true }
    type='submit'
    onBlur={ () => store.validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

function formOnClick(store: FormStore, cb) {
  store.validateAll();

  if (store.isValid && cb) {
    cb();
  }
}
