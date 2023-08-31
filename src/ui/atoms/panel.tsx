import React from 'react';
import { Label } from "./label";
import { C, getStyleByGrid } from "./grid";
import { maybeLabeledControl } from './utils';

export const Panel = ({ children, className = undefined, disabled = undefined, label = null, x = undefined, onClick = undefined, containerStyle = null, style = undefined }: any) => {
    const Element = <div 
        className={ disabled ? 'panel primary disabled' : 'panel primary' }
        style={ style }
        onClick={ !disabled ? onClick : undefined }
    >{ children }</div>;

    return maybeLabeledControl(Element, label);
}