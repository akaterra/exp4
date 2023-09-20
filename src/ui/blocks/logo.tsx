import * as React from 'react';
import { observer } from "mobx-react-lite";
import { RootStore } from '../stores/root';
import logo from '../atoms/logo.top.inv.png';
import { SubSubTitle, SubTitle } from '../atoms/title';
import { Link } from '../atoms/link';

const style = {
  container: {
    backgroundColor: '#ff0055',
    color: 'white',
  },
  containerProfile: {
    backgroundColor: '#ff0055',
    color: '#ffff80',
  },
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
    backgroundSize: '1290px 45px',
    height: '45px',
    minHeight: '45px',
  },
}

export const Logo = observer(({ store }: { store: RootStore }) => {
  return <React.Fragment>
    <div className='show-sml' style={ style.container }>
      <div style={ style.logo } />
    </div>
    <div className='show-med show-lrg' style={ style.layer }>
      <div className="container med ltr square pad-hor triple">
        <div className='row'>
          <div className='c-3 clear-padding' style={ style.container }>
            <div className='paragraph paragraph-lrg'>
              <div style={ style.logo } />
            </div>
            <div className='c18'>
              <div className='paragraph paragraph-lrg flex flex-ver flex-middle'>
                <SubTitle>
                  <span style={ style.containerProfile }>{ store.user?.name ?? store.user?.id }</span>
                </SubTitle>
                <SubSubTitle><Link activeClassName="link failure" className='link failure' onClick={ () => store.logout() }>
                  <span style={ style.container }>Logout</span>
                </Link></SubSubTitle>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </React.Fragment>;
});
