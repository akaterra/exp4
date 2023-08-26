import React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const Modal = ({ children, title = undefined, titleContent = undefined, onClose = undefined }: any) => {
  return <div className="modal">
    <div className="modal-content f15 clear">
      <div className="panel unbound shadow shadow-high paragraph">
        <div className='row'>
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
  </div>;
}
