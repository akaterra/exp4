import React from 'react';
import './grid.css';

const styleCache = {

}

export function getStyleByGrid(grid: number | '*', style, ns?) {
  if (!grid) {
    return style;
  }

  if (!ns) {
    ns = grid;
  } else {
    ns = ns + ':' + grid;
  }

  if (!(ns in styleCache)) {
    styleCache[ns] = { ...style, width: grid === '*' || grid === -1 ? '100%' : `${5 * grid}em` };
  }

  return styleCache[ns];
}

export function C({ x, className = '', children, id }: { x?: number | string, className?: string, children?, id? }) {
  if (!className) {
    className = '';
  }

  if (!x) {
    className = 'c18 -s- ' + className;
  } else {
    if (typeof x === 'string') {
      className = `${x} ${className}`;
    } else {
      if (x < 10) {
        className = `c-${x} -s- ${className}`;
      } else {
        className = `c${x} -s- ${className}`;
      }    
    }
  }

  return <div className={ className } key={ id }>{ children }</div>;
}
