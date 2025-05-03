import React from 'react';
import './link.css';
import { maybeClassName } from './utils';
import { NavLink as NavLinkBase } from 'react-router-dom';

export const Link = ({ children, className = undefined, href = undefined, key = undefined, onClick = undefined, style = undefined }: any) => {
  return <a href={ href } className={ maybeClassName('link', className) } key={ key } style={ style } onClick={ onClick }>{ children }</a>;
}

export const NavLink = ({ children, className = undefined, href = undefined, key = undefined, onClick = undefined, style = undefined }: any) => {
  const cn = maybeClassName('link', className);

  return <NavLinkBase
    to={ href }
    className={	() => cn }
    key={ key }
    style={ style }
    onClick={ onClick }
  >{ children }</NavLinkBase>;
}
