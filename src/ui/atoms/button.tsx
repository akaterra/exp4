import React from 'react';
import { maybeLabeledControl, stylize } from './utils';

export const componentStyle = {

};
export const componentSingleStyle = {

};

export const Button = ({ children, className = null, disabled = false, key = undefined, label = null, x = undefined, onClick = undefined, style = {} }: any) => {
  const Component = <button
    className={ disabled ? `button unbound ${className ?? ''} disabled` : `button unbound ${className ?? ''}` }
    disabled={ disabled }
    key={ key }
    style={ style }
    onClick={ !disabled
      ? () => {
        // e.preventDefault();

        if (onClick) {
          onClick();
        }
      }
      : undefined
    }
  >{ children }</button>;

  return maybeLabeledControl(Component, x, label);
}

Button.Failure = stylize(Button, { className: 'failure' });

Button.Success = stylize(Button, { className: 'success' });
