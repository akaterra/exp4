import * as React from 'react';
import { Button } from './button';

export const InfoCollapse = ({ children, isDisabled, label, showTitle, hideTitle }: any) => {
  const [ isShown, setIsShown ] = React.useState(false);

  return <div onMouseLeave={ () => setIsShown(false) }>
    <div>
      <Button
        className={ `button-sml ${label ?? 'default'} auto` }
        disabled={ isDisabled }
        x={ null }
        onClick={ () => setIsShown(!isShown) }
      >
        { isShown ? hideTitle ?? 'Hide' : showTitle ?? 'Info' }
      </Button>
    </div>
    <div>
      { isShown ? children : null }
    </div>
  </div>;
}
