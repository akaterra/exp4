import React from 'react';
import { C } from './grid';
import { stylize } from './utils';

export const SubSubTitle = ({ x = null, children, className = undefined, style = undefined }) => {
  const control = <div className={ className ? `caption smallest ${className}` : 'caption smallest' } style={ style }>{ children }</div>;

  if (x !== null) {
    return <C x={ x }>{ control }</C>;
  }

  return control;
};

SubSubTitle.Primary = stylize(SubSubTitle, { className: 'primary' });

export const SubTitle = ({ x = null, children, className = undefined, style = undefined }) => {
  const control = <div className={ className ? `caption smaller ${className}` : 'caption smaller' } style={ style }>{ children }</div>;

  if (x !== null) {
    return <C x={ x }>{ control }</C>;
  }

  return control;
};

SubTitle.Primary = stylize(SubTitle, { className: 'primary' });

export const Title = ({ x = null, children, className = undefined, style = undefined }) => {
  const control = <div className={ className ? `caption ${className}` : 'caption' } style={ style }>{ children }</div>;

  if (x !== null) {
    return <C x={ x }>{ control }</C>;
  }

  return control;
};

Title.Primary = stylize(Title, { className: 'primary' });
