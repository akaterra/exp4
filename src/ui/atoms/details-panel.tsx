import React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const DetailsPanel = ({ children, title = undefined, titleContent = undefined, onClose = undefined }: any) => {
  return <div className='modal'>
    <div className='flex h-100'>
      <div className='c14 c10-m- c-4-s- clear'></div>
      <div className='c-4 c-8-m- c14-s- clear back-light h-100 shadow shadow-high span default'>
        <div className='paragraph paragraph-lrg'>
          <div className='c18'>
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
          </div>
          <div className='c18 children-gap-full'>
            { children }
          </div>
        </div>
      </div>
    </div>
  </div>;
}
