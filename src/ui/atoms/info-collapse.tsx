import * as React from 'react';
import { useState } from 'react';
import { Button } from './button';

export const InfoCollapse = ({ children, isFailed, showTitle, hideTitle }: any) => {
  const [ isShown, setIsShown ] = React.useState(false);

  return <div>
    <div>
      <Button className={ isFailed ? 'button-sml failure auto' : 'button-sml success auto' } x={ null } onClick={ () => setIsShown(!isShown) }>
        { isShown ? hideTitle ?? 'Hide' : showTitle ?? 'Info' }
      </Button>
    </div>
    <div>
      { isShown ? children : null }
    </div>
  </div>;
}
