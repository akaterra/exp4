import * as React from 'react';
import { observer } from "mobx-react-lite";
import { RootStore } from '../stores/root';
import logo from '../atoms/logo.top.inv.png';
import { SubSubTitle, SubTitle } from '../atoms/title';
import { Link } from '../atoms/link';

const style = {
  container: {
    // backgroundColor: '#ff3377',
    // color: 'white',
    position: 'relative',
  } as React.CSSProperties,
  containerColor: {
    // color: '#fff',
  },
  containerProfile: {
    // color: '#fff',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '10px',
  } as React.CSSProperties,
  layer: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 50000,
  } as React.CSSProperties,
  logo: {
    backgroundImage: `url(${logo})`,
    backgroundPosition: '50%',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '2030px 45px',
    height: '45px',
    minHeight: '45px',
    filter: 'drop-shadow(0px 2px 1px rgba(0, 0, 0, .2))',
  },
}

export const Logo = observer(({ store }: { store: RootStore }) => {
  return <React.Fragment>
    <div className='show-sml1' style={ style.container }>
      <div style={ style.logo } />
      <div className='flex flex-end' style={ style.containerProfile }>
        <div className="container med ltr square pad-hor triple h-auto">
          <div className='row flex flex-right'>
            <div className='c-6 flex flex-hor flex-right children-gap-hor'>
              {
                store.isAuthorized
                  ? <React.Fragment>
                    <SubSubTitle className='w-auto'>
                      <span style={ style.container }>{ store.user?.name ?? store.user?.id }</span>
                    </SubSubTitle>
                    <SubSubTitle className='w-auto'><Link activeClassName="link failure" className='link failure' onClick={ () => store.logout() }>
                      <span style={ style.container }>Logout</span>
                    </Link></SubSubTitle>
                  </React.Fragment>
                  : <SubSubTitle className='w-auto'><Link activeClassName="link active" href={ store.authMethods?.github?.actions?.redirect } className='link'>
                    Login
                  </Link></SubSubTitle>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  </React.Fragment>;
});
