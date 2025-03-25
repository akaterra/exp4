import React from 'react';
import { maybeLabeledControl } from './utils';

export const componentStyle = {

};
export const componentSingleStyle = {

};

export const Content = ({ children, label = null, x = undefined, style = {} }) => {
  const control = <div
    className='children-gap-full'
    style={ style }
  >{ children }</div>;

  return maybeLabeledControl(control, x, label);
}
