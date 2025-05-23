import * as React from 'react';
import { Fragment } from 'react';
import { C } from "./grid";
import { Label } from "./label";

export const FICTIVE = Symbol('FICTIVE');

export function maybeClassName(base, extended) {
  return extended ? `${base} ${extended}` : base;
}

export function maybeLabeledControl(Element, x, label?, error?) {
  const E = error
    ? <Fragment>
      { Element }
      {
        error
          ? <div className='label failure flex flex-right'>{ error }</div>
          : null
      }
    </Fragment>
    : Element;

  if (!label) {
    if (x !== null) {
      return <C x={ x }>{ E }</C>;
    }

    return E;
  }

  return x !== null
    ?<C className='children-gap' x={ x }>
      <Label error={ error }>{ label === FICTIVE ? '' : label }</Label>
      { E }
    </C>
    : <Fragment>
      <Label error={ error }>{ label === FICTIVE ? '' : label }</Label>
      { E }
    </Fragment>;
}

export function stylize(Component, def: {
    frame?: true;
    horGap?: true;
    horPad?: true;
    verGap?: true;
    verPad?: true;
    style?: any;
} & Record<string, any>) {
  const s = def.style;
  let set = false;

  for (const key of Object.keys(def)) {
    if (def[key] && key !== 'style') {
      def[key] = key;
      set = true;
    } else {
      delete def[key];
    }
  }

  const inlineClassName = set ? Object.values({ ...def }).join(' ') : '';

  return (props) => <Component className={ inlineClassName } style={ s } { ...props } />;
}
