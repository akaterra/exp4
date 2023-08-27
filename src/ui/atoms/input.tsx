import React from 'react';
import './input.css';
import { mayBeLabeledControl } from './utils';

export const componentStyle = {

};
export const componentSingleStyle = {

};

export const Checkbox = ({ children, className = undefined, currentValue = undefined, disabled = undefined, onChange = undefined, style = undefined }: any) => {
    return <label className='flex flex-start'><input
        className={ className ? `checkbox ${className}` : 'checkbox' }
        disabled={ disabled }
        checked={ currentValue }
        style={ style }
        type='checkbox'
        onChange={ !disabled && onChange ? ((e) => onChange((e.target as HTMLInputElement).checked)) : undefined }
    />{ children }</label>;
}

export const Radio = ({ children, className = undefined, currentValue = undefined, disabled = undefined, onChange = undefined, style = undefined }: any) => {
    return <label className='flex flex-start'><input
        className={ className ? `checkbox ${className}` : 'checkbox' }
        disabled={ disabled }
        checked={ currentValue }
        style={ style }
        type='radio'
        onChange={ !disabled && onChange ? ((e) => onChange((e.target as HTMLInputElement).checked)) : undefined }
    />{ children }</label>;
}

export const Input = ({ currentValue = undefined, disabled = undefined, label = undefined, min = undefined, type = undefined, x = undefined, onChange = undefined, placeholder = '', style = undefined }: any) => {
    const Component = <input
        className='control'
        disabled={ disabled }
        min={ min }
        placeholder={ placeholder }
        style={ style }
        type={ type ?? 'input' }
        value={ currentValue }
        onChange={ !disabled && onChange ? ((e) => onChange((e.target as HTMLInputElement).value)) : undefined }
    />;

    return mayBeLabeledControl(Component, x, label);
}
