import React from 'react';

export const Time = ({ className = undefined, time }) => {
  return <span className={ className }>{ time ? new Date(time).toLocaleString() : 'Unknown time' }</span>;
};
