import * as React from 'react';
import { Status } from '../enums/status';

export const TitledLine = ({ children, isShown = true, title = undefined }: any) => {
  if (!isShown) {
    return null;
  }

  return <div>
    { title ?? 'Status:' }
    <span className='bold'> { children }</span>
  </div>;
};

export const StatusLine = ({ isFailed = false, status = undefined, title = undefined }: any) => {
  if (typeof status !== 'string') {
    status = isFailed ? Status.FAILED : Status.SUCCESS;
  }

  return <div>
    { title ?? 'Status:' }
    <span className={
      status === Status.FAILED
        ? 'span failure bold'
        : status === Status.SUCCESS ? 'span success bold' : 'span warning bold'
    }> { status }</span>
  </div>;
};
