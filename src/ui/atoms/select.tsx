import React from 'react';
import { Label } from "./label";
import { C, getStyleByGrid } from "./grid";
import { mayBeLabeledControl } from './utils';

export const Select = ({ currentValue = null, decoration = null, disabled = false, items, label = null, onChange = null, containerClassName=null, containerStyle = null, style = null, x = 2 }: { items: string[] | Record<string, any> } & any) => {
    const control = Array.isArray(items)
        ? <select
            className={ disabled ? `control ${decoration ?? ''} disabled` : `control ${decoration ?? ''}` }
            disabled={ disabled }
            onChange={
                !disabled &&
                onChange &&
                ((e) => onChange(items[(e.target as HTMLSelectElement).selectedIndex]))
            }
        >{ items.map((e) => <option selected={ e === currentValue } value={ e }>{ e }</option>) }</select>
        : <select
            className={ disabled ? `control ${decoration ?? ''} disabled` : `control ${decoration ?? ''}` }
            disabled={ disabled }
            onChange={
                !disabled &&
                onChange &&
                ((e) => onChange((e.target as HTMLSelectElement).options[(e.target as HTMLSelectElement).selectedIndex].value))
            }
        >{ Object.entries<string>(items ?? {}).map(([optionVal, optionTitle]) => <option selected={ optionVal === currentValue } value={ optionVal }>{ optionTitle }</option>) }</select>;

    return mayBeLabeledControl(control, x, label);
}
