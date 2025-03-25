import * as React from 'react';
import logo from './logo.top.png';

const style = {
  backgroundImage: `url(${logo})`,
  backgroundPosition: '50%',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '300px 60px',
  height: '60px',
  minHeight: '60px',
}

export const Logo = () => {
  return <div style={ style } />;
}
