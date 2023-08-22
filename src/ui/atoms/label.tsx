import React from 'react';
import './label.css';

export const Label = ({ children, style = undefined }: any) => {
    return <div className={ children === true ? 'label with-fictive-content' : 'label' } style={ style }>{ children }</div>;
};
