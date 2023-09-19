import * as React from 'react';
import { Status } from '../enums/status';

export const TitledLine = ({ children, isShown = true, title = undefined }: any) => {
  if (!isShown) {
    return null;
  }

  return <div>
    { title ?? 'Status:' }
    <span className='bold'> { getChildren(children) }</span>
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

export const Value = ({ children: value }: any) => {
  return value && typeof value === 'object'
    ? <span className={ `span ${value.level ?? 'default'} bold` }>{ value.value }</span>
    : <span className={ `span default bold` }>{ value }</span>;
};

export const ValueMaybeSuccess = ({ value }: any) => {
  return value && typeof value === 'object'
    ? <span className={ `span ${value.level ?? 'success'} bold` }>{ value.value }</span>
    : <span className='span success bold'>{ value }</span>;
};

function getChildren(children) {
  if (Array.isArray(children)) {
    return children.map(
      (child) => child && typeof child === 'object' && child.level
        ? <span className={ `span ${child.level}` }>{ child.value }</span>
        : child
    );
  }

  return children && typeof children === 'object' && children.level
    ? <span className={ `span ${children.level}` }>{ children.value }</span>
    : children;
}
