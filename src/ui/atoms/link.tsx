import React from 'react';
import './link.css';

export const Link = ({ children, href = undefined, onClick = undefined, style = undefined }: any) => {
    return <a href={ href } className='link' style={ style } onClick={ onClick }>{ children }</a>;
}
