import React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const DetailsPanel = ({ children, title = undefined, titleContent = undefined, onClose = undefined }: any) => {
  return <div className='modal'>
    <div className='flex h-max'>
      <div className='c12 c-8-m- c-4-s- clear'></div>
      <div className='c-6 c10-m- c14-s- back-light max-height shadow shadow-high span default left-padded right-padded triple'>
        <div className='paragraph paragraph-lrg'>
          <div className='row'>
            <div className='c18'>
              <div>
                <div className='flex flex-hor'>
                  <SubTitle>{ title }</SubTitle>
                  {
                    onClose
                      ? <Button className='button-sml default transparent w-auto' x={ null } onClick={ onClose ? () => onClose(null) : null }>✖</Button>
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
    </div>
  </div>;
}
