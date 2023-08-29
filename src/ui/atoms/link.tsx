import React from 'react';
import './link.css';
import { maybeClassName } from './utils';

export const Link = ({ children, className = undefined, href = undefined, onClick = undefined, style = undefined }: any) => {
    return <a href={ href } className={ maybeClassName('link', className) } style={ style } onClick={ onClick }>{ children }</a>;
}
