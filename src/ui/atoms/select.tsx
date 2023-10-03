import React, { useState } from 'react';
import { maybeLabeledControl } from './utils';

export const Select = ({ autoComplete = undefined, className = undefined, currentValue = undefined, decoration = undefined, disabled = false, error = undefined, items, id = undefined, label = undefined, onBlur = undefined, onChange = undefined, x = 2 }: { items: string[] | Record<string, any> } & any) => {
  if (error) {
    className = className ? `${className} failure` : 'failure';
  }

  const [ value, setValue ] = useState(currentValue);

  const control = Array.isArray(items)
    ? <select
      autoComplete={ autoComplete }
      className={ disabled ? `control ${decoration ?? ''} disabled` : `control ${decoration ?? ''}` }
      disabled={ disabled }
      key={ id }
      onBlur={
        !disabled &&
                onBlur &&
                ((e) => onBlur(items[(e.target as HTMLSelectElement).selectedIndex]))
      }
      onChange={ !disabled
        ? (e) => {
          const value = items[(e.target as HTMLSelectElement).selectedIndex];

          setValue(value);
    
          if (onChange) {
            onChange(value);
          }
        }
        : undefined
      }
    >{ items.map((e) => <option selected={ e === value } value={ e }>{ e }</option>) }</select>
    : <select
      className={ disabled ? `control ${decoration ?? ''} disabled` : `control ${decoration ?? ''}` }
      disabled={ disabled }
      key={ id }
      onBlur={
        !disabled &&
                onBlur &&
                ((e) => onBlur((e.target as HTMLSelectElement).options[(e.target as HTMLSelectElement).selectedIndex].value))
      }
      onChange={ !disabled
        ? (e) => {
          const value = Object.keys(items)[(e.target as HTMLSelectElement).selectedIndex];

          setValue(value);

          if (onChange) {
            onChange(value);
          }
        }
        : undefined
      }
    >{ Object.entries<string>(items ?? {}).map(([ optionVal, optionTitle ]) => <option selected={ optionVal === value } value={ optionVal }>{ optionTitle }</option>) }</select>;

  return maybeLabeledControl(control, x, label, error);
}
