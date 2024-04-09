import React from 'react';
import './label.css';

export const Label = ({ children, style = undefined, error = false }: any) => {
  return <div className={ children === true ? `label with-fictive-content${error ? ' failure' : ''}` : `label${error ? ' failure' : ''}` } style={ style }>{ children }</div>;
};
