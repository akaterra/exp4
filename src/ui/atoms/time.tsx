import React from 'react';

export const Time = ({ className = undefined, time }) => {
  return time ? <span className={ className }>{ new Date(time).toLocaleString() }</span> : null;
};
