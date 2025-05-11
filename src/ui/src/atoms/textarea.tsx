import React from 'react';
import './input.css';
import { maybeLabeledControl } from './utils';

export const Textarea = ({ className = undefined, currentValue = undefined, disabled = undefined, error = undefined, id = undefined, label = undefined, onBlur = undefined, onChange = undefined, placeholder='', rows = 5, x = undefined, style = undefined }: any) => {
  if (error) {
    className = className ? `${className} failure` : 'failure';
  }

  const control = <textarea
    className={ className ? `control ${className}` : 'control' }
    defaultValue={ currentValue }
    key={ id }
    placeholder={ placeholder }
    rows={ rows }
    style={ style }
    onBlur={ !disabled && onBlur ? ((e) => onBlur((e.target as HTMLTextAreaElement).value)) : undefined }
    onChange={ onChange && ((e) => {
      onChange((e.target as HTMLTextAreaElement).value);
    }) }
  />;

  return maybeLabeledControl(control, x, label, error);
}
