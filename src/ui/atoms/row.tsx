import React from 'react';
import './input.css';
import { stylize } from './utils';

export const componentStyle = {
  control: {},
};

export const Cow = ({ children, onClick = undefined, style = undefined }: any) => {
  return <div className='cow' style={ style } onClick={ onClick }>{ children }</div>;
}

Cow.M = stylize(Cow, { className: 'row h-max' });

export const Row = ({ children, onClick = undefined, style = undefined }: any) => {
  return <div className='row' style={ style } onClick={ onClick }>{ children }</div>;
}

Row.M = stylize(Row, { className: 'row h-max' });
