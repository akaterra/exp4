import * as React from 'react-dom';
import { observer } from "mobx-react-lite";
import { ModalStore } from "../stores/modal";
import { FormStore } from '../stores/form';
import { Button } from '../atoms/button';
import { Input } from '../atoms/input';
import { Select } from '../atoms/select';
import {Textarea} from '../atoms/textarea';

export const detailsPanelStore = new ModalStore();

export const FormButton = observer(({ store, id, key, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button
    { ...props }
    error={ id ? store.__isError[id] : null }
    id={ key ?? id }
    label={ id ? store.__schema[id]?.title ?? props.label : props.label }
    onBlur={ () => store.__validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

export const FormInput = observer(({ store, id, key, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Input
    { ...props } currentValue={ store.__get(id) ?? '' }
    error={ store.__isError[id] }
    id={ key ?? id }
    label={ store.__schema[id]?.title ?? props.label }
    onBlur={ () => store.__validate(id) }
    onChange={ (val) => store.__onChange(id, val) }
  />;
});

export const FormTextInput = observer(({ store, id, key, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Textarea
    { ...props } children={ store.__get(id) ?? '' }
    error={ store.__isError[id] }
    id={ key ?? id }
    label={ store.__schema[id]?.title ?? props.label }
    onBlur={ () => store.__validate(id) }
    onChange={ (val) => store.__onChange(id, val) }
  />;
});

export const FormSelect = observer(({ store, id, key, ...props }: { store: FormStore, id: string } & Record<string, unknown>) => {
  return <Select
    { ...props } currentValue={ store.__get(id) }
    error={ store.__isError[id] }
    id={ key ?? id }
    label={ store.__schema[id]?.title ?? props.label }
    onBlur={ () => store.__validate(id) }
    onChange={ (val) => store.__onChange(id, val) }
  />;
});

export const FormSubmit = observer(({ store, id, key, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button
    { ...props }
    disabled={ false }
    error={ id ? store.__isError[id] : null }
    id={ key ?? id }
    label={ id ? store.__schema[id]?.title ?? props.label : props.label }
    preventDefault={ true }
    type='submit'
    onBlur={ () => store.__validate(id) }
    onClick={ () => formOnClick(store, props.onClick) }
  />;
});

export const FormSubmitActive = observer(({ store, id, key, ...props }: { store: FormStore, id?: string } & Record<string, unknown>) => {
  return <Button
    { ...props }
    disabled={ !store.__isValid }
    error={ id ? store.__isError[id] : null }
    id={ key ?? id }
    label={ id ? store.__schema[id]?.title ?? props.label : props.label }
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
