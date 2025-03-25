import React from 'react';

export const Overlay = ({ children, isShown }) => {
  if (isShown) {
    return <div className='modal'>{ children }</div>
  }

  return null;
};
