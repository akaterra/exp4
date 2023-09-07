import * as React from 'react';
import { Button } from './button';

export const InfoCollapse = ({ children, isDisabled, isFailed, isIdle, showTitle, hideTitle }: any) => {
  const [ isShown, setIsShown ] = React.useState(false);

  return <div onMouseLeave={ () => setIsShown(false) }>
    <div>
      <Button className={
        isFailed
          ? 'button-sml failure auto'
          : isIdle
            ? 'button-sml default auto'
            : 'button-sml success auto'
      } disabled={ isDisabled } x={ null } onClick={ () => setIsShown(!isShown) }>
        { isShown ? hideTitle ?? 'Hide' : showTitle ?? 'Info' }
      </Button>
    </div>
    <div>
      { isShown ? children : null }
    </div>
  </div>;
}
