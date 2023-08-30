import React from 'react';
import './link.css';
import { maybeClassName } from './utils';
import { NavLink as NavLinkBase } from 'react-router-dom';

export const Link = ({ children, className = undefined, href = undefined, onClick = undefined, style = undefined }: any) => {
    return <a href={ href } className={ maybeClassName('link', className) } style={ style } onClick={ onClick }>{ children }</a>;
}

export const NavLink = ({ children, className = undefined, href = undefined, onClick = undefined, style = undefined }: any) => {
    return <NavLinkBase to={ href } className={ maybeClassName('link', className) } style={ style } onClick={ onClick }>{ children }</NavLinkBase>;
}
