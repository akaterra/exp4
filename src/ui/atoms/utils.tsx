import React from 'react';
import { Fragment } from 'react';
import { C } from "./grid";
import { Label } from "./label";

export function mayBeLabeledControl(Element, x, label?) {
    if (!label) {
        if (x !== null) {
            return <C x={ x }>{ Element }</C>;
        }

        return Element;
    }

    return x !== null
        ?<C className='children-gap-full' x={ x }>
            <Label>{ label }</Label>
            { Element }
        </C>
        : <Fragment>
            <Label>{ label }</Label>
            { Element }
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
