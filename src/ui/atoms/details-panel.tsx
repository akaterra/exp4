import React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const DetailsPanel = ({ children, title = undefined, titleContent = undefined, onClose = undefined }: any) => {
  return <div className='modal'>
    <div className='flex h-100'>
      <div className='c14 c10-m- clear'></div>
      <div className='c-4 c-8-m- clear back-light h-100 shadow shadow-high'>
        <div className='paragraph paragraph-lrg'>
          <div className='panel unbound transparent clear'>
            <div className='c18 children-gap'>
              <div>
                <div className='flex flex-hor'>
                  <SubTitle>{ title }</SubTitle>
                  {
                    onClose
                      ? <Button className='button-sml default transparent w-auto' x={null} onClick={onClose ? () => onClose(null) : null}>✖</Button>
                      : null
                  }
                </div>
                { titleContent }
              </div>
              { children }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
