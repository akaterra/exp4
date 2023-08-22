import React from 'react';
import { mayBeLabeledControl } from './utils';

export const componentStyle = {

};
export const componentSingleStyle = {

};

export const Content = ({ children, label = null, x = undefined, style = {} }) => {
    const control = <div
        className='children-gap-full'
        style={ style }
    >{ children }</div>;

    return mayBeLabeledControl(control, x, label);
}
