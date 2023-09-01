import * as React from 'react';
import { SubTitle } from './title';
import { Button } from './button';

export const Modal = ({
  buttons = {
    cancel: {
      action: 'cancel',
      disabled: false,
      onSelect: null,
      title: 'Cancel',
      type: '',
    },
    ok: {
      action: 'ok',
      disabled: false,
      onSelect: null,
      title: 'OK',
      type: 'active',
    },
  },
  children,
  title = undefined,
  titleContent = undefined,
  onClose = undefined,
  onSelect = undefined,
}: {
  buttons?: Record<string, { action?: string; disabled?: Boolean; onSelect?: (action?) => void, title?: string, type?: string }>;
  children,
  title: React.ReactElement | string;
  titleContent?: React.ReactElement | string;
  onClose?: () => void,
  onSelect?: (action?: string) => void,
}) => {
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
                    ? <Button className='button-sml default transparent w-auto' x={null} onClick={ onClose }>✖</Button>
                    : null
                }
              </div>
              { titleContent }
            </div>
            { children }
            <div className='row flex-right'>
              {
                Object.entries(buttons).map(([ key, button ]) => {
                  return <Button
                    className={ button.type === 'active' ? '' : 'default transparent' }
                    disabled={ button.disabled }
                    key={ key }
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
