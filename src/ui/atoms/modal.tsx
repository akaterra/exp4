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
  onClose = undefined,
  onSelect = undefined,
}: {
  buttons?: Record<string, { action?: string; disabled?: boolean; onSelect?: (action?) => void, title?: string, type?: string }>;
  children,
  title: React.ReactElement | string;
  onClose?: () => void,
  onSelect?: (action?: string) => void,
}) => {
  return <div className="modal">
    <div className="modal-content f10 f14-s- back-light shadow shadow-high pad-hor triple">
      <div className="paragraph">
        <div className='row'>
          <div className='c18 children-gap-full'>
            <div>
              <div className='flex flex-hor'>
                {
                  typeof title === 'string'
                    ? <SubTitle>{ title }</SubTitle>
                    : title
                }
                {
                  onClose
                    ? <Button className='button-sml default transparent w-auto' x={null} onClick={ onClose }>✖</Button>
                    : null
                }
              </div>
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
