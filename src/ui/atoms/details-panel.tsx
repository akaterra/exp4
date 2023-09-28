import React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const DetailsPanel = ({ children, title = undefined, titleContent = undefined, onClose = undefined }: any) => {
  return <div className='modal'>
    <div className='flex h-max'>
      <div className='c12 c-8-m- c-4-s- clear'></div>
      <div className='c-6 c10-m- c14-s- back-light max-height shadow shadow-high pad-hor triple'>
        <div className='paragraph paragraph-lrg'>
          <div className='row'>
            <div className='c18'>
              <div>
                <div className='flex flex-hor'>
                  {
                    typeof title === 'string'
                      ? <SubTitle>{ title }</SubTitle>
                      : title
                  }
                  {
                    onClose
                      ? <Button className='button-sml default transparent w-auto' x={ null } onClick={ onClose ? () => onClose(null) : null }><i className="fa-solid fa-xmark fa-lg"></i></Button>
                      : null
                  }
                </div>
                { titleContent }
              </div>
            </div>
            <div className='c18 children-gap'>
              { children }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
