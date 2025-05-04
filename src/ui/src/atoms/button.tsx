import React from 'react';
import { maybeLabeledControl, stylize } from './utils';

export const componentStyle = {

};
export const componentSingleStyle = {

};

export const Button = ({ children, className = null, disabled = false, error = undefined, label = null, preventDefault = undefined, x = undefined, type = undefined, onBlur = undefined, onClick = undefined, style = {} }: any) => {
  const Component = <button
    className={ disabled ? `button unbound ${className ?? ''} disabled` : `button unbound ${className ?? ''}` }
    disabled={ disabled }
    style={ style }
    type={ type }
    onBlur={ !disabled && onBlur ? ((e) => onBlur((e.target as HTMLInputElement).value)) : undefined }
    onClick={ !disabled
      ? (e) => {
        if (preventDefault) {
          e.preventDefault();
        }

        if (onClick) {
          onClick();
        }
      }
      : undefined
    }
  >{ children }</button>;

  return maybeLabeledControl(Component, x, label, error);
}

Button.Failure = stylize(Button, { className: 'failure' });

Button.Success = stylize(Button, { className: 'success' });
