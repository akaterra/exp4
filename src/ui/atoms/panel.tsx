import React from 'react';
import { maybeLabeledControl } from './utils';

export const Panel = ({ children, disabled = undefined, label = null, onClick = undefined, style = undefined }: any) => {
  const Element = <div 
    className={ disabled ? 'panel primary disabled' : 'panel primary' }
    style={ style }
    onClick={ !disabled ? onClick : undefined }
  >{ children }</div>;

  return maybeLabeledControl(Element, label);
}
