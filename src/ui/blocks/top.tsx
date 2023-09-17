import * as React from 'react';
import { Logo } from '../atoms/logo';
import { Input } from '../atoms/input';

export const Top = () => {
  return <React.Fragment>
    <div className='c-3 -s-'>
      <Logo />
    </div>
    {/* <div className='c12'>
      <Input x={ null } />
    </div> */}
  </React.Fragment>;
}
