import React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const Modal = ({
  buttons = [ {
    action: 'cancel',
    onSelect: null,
    title: 'Cancel',
    type: '',
  }, {
    action: 'ok',
    onSelect: null,
    title: 'OK',
    type: 'active',
  } ],
  children,
  title = undefined,
  titleContent = undefined,
  onClose = undefined,
  onSelect = undefined,
}: any) => {
  return <div className="modal">
    <div className="modal-content f10 back-light shadow shadow-high span default left-padded right-padded triple">
      <div className="paragraph">
        <div className='row'>
          <div className='c18 children-gap-full'>
            <div>
              <div className='flex flex-hor'>
                <SubTitle>{ title }</SubTitle>
                {
                  onClose
                    ? <Button className='button-sml default transparent w-auto' x={null} onClick={ onClose ? () => onClose(null) : null }>✖</Button>
                    : null
                }
              </div>
              { titleContent }
            </div>
            { children }
            <div className='row flex-right'>
              {
                buttons.map((button, i) => {
                  return <Button
                    className={ button.type === 'active' ? '' : 'default transparent' }
                    key={ i }
                    x={ 4 }
                    onClick={ () => button.onSelect ? button.onSelect(button.action) : onSelect ? onSelect(button.action) : null }
                  >{ button.title }</Button>
                })
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>;
}
