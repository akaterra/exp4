import React, { useState } from 'react';
import './input.css';
import { maybeLabeledControl } from './utils';

export const componentStyle = {

};
export const componentSingleStyle = {

};

export const Checkbox = ({ children, className = undefined, currentValue = undefined, disabled = undefined, error = undefined, x = undefined, onBlur = undefined, onChange = undefined, placeholder = '', style = undefined }: any) => {
  if (error) {
    className = className ? `${className} failure` : 'failure';
  }

  const [ value, setValue ] = useState(currentValue);

  const Element = <label className='flex flex-start'><input
    className={ className ? `checkbox ${className}` : 'checkbox' }
    disabled={ disabled }
    checked={ value }
    placeholder={ placeholder }
    style={ style }
    type='checkbox'
    onBlur={ !disabled && onBlur ? ((e) => onBlur((e.target as HTMLInputElement).checked)) : undefined }
    onChange={ !disabled
      ? (e) => {
        setValue((e.target as HTMLInputElement).checked);

        if (onChange) {
          onChange((e.target as HTMLInputElement).checked);
        }
      }
      : undefined
    }
  />{ children }</label>;

  return maybeLabeledControl(Element, x, null, error);
}

export const CheckboxControl = ({ children, className = undefined, currentValue = undefined, disabled = undefined, error = undefined, label = undefined, x = undefined, onBlur = undefined, onChange = undefined, placeholder = '', style = undefined }: any) => {
  if (error) {
    className = className ? `${className} failure` : 'failure';
  }

  const [ value, setValue ] = useState(currentValue);

  const Element = <label className='control transparent unbound clear-pl flex flex-middle'><input
    className={ className ? `checkbox ${className}` : 'checkbox' }
    disabled={ disabled }
    checked={ value }
    placeholder={ placeholder }
    style={ style }
    type='checkbox'
    onBlur={ !disabled && onBlur ? ((e) => onBlur((e.target as HTMLInputElement).checked)) : undefined }
    onChange={ !disabled
      ? (e) => {
        setValue((e.target as HTMLInputElement).checked);

        if (onChange) {
          onChange((e.target as HTMLInputElement).checked);
        }
      }
      : undefined
    }
  />{ children }</label>;

  return maybeLabeledControl(Element, x, label, error);
}

export const RadioGroup = ({ children, className = undefined, currentValue = undefined, disabled = undefined, error = undefined, onBlur = undefined, onChange = undefined, placeholder = '', style = undefined }: any) => {
  if (error) {
    className = className ? `${className} failure` : 'failure';
  }

  const [ value, setValue ] = useState(currentValue);

  const Element = <label className='flex flex-start'><input
    className={ className ? `checkbox ${className}` : 'checkbox' }
    disabled={ disabled }
    checked={ value }
    placeholder={ placeholder }
    style={ style }
    type='radio'
    onBlur={ !disabled && onBlur ? ((e) => onBlur((e.target as HTMLInputElement).checked)) : undefined }
    onChange={ !disabled
      ? (e) => {
        setValue((e.target as HTMLInputElement).checked);

        if (onChange) {
          onChange((e.target as HTMLInputElement).checked);
        }
      }
      : undefined
    }
  />{ children }</label>;

  return maybeLabeledControl(Element, null, null, error);
}

export const Input = ({ autoComplete = undefined, className = undefined, currentValue = undefined, disabled = undefined, error = undefined, label = undefined, min = undefined, type = undefined, x = undefined, onBlur = undefined, onChange = undefined, placeholder = '', style = undefined }: any) => {
  if (error) {
    className = className ? `${className} failure` : 'failure';
  }

  const [ value, setValue ] = useState(currentValue);

  const Element = <input
    autoComplete={ autoComplete }
    className={ className ? `control ${className}` : 'control' }
    disabled={ disabled }
    min={ min }
    placeholder={ placeholder }
    style={ style }
    type={ type ?? 'input' }
    value={ value }
    onBlur={ !disabled && onBlur ? ((e) => onBlur((e.target as HTMLInputElement).value)) : undefined }
    onChange={ !disabled
      ? (e) => {
        setValue((e.target as HTMLInputElement).value);

        if (onChange) {
          onChange((e.target as HTMLInputElement).value);
        }
      }
      : undefined
    }
  />;

  return maybeLabeledControl(Element, x, label, error);
}
