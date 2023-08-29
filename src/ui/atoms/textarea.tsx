import React from 'react';
import './input.css';
import { maybeLabeledControl } from './utils';

export const Textarea = ({ children, label = undefined, onChange = undefined, placeholder='', rows = 5, x = undefined, style = undefined }: any) => {
    const control = <textarea
        className='control'
        placeholder={ placeholder }
        rows={ rows }
        style={ style }
        onChange={ onChange && ((e) => onChange((e.target as HTMLTextAreaElement).value)) }
    >{ children }</textarea>;

    return maybeLabeledControl(control, x, label);
}
