import * as React from 'react';
import { observer } from "mobx-react-lite";
import { RootStore, rootStore } from '../stores/root';
import logo from '../atoms/logo.top.inv.png';
import landingLogo from '../atoms/logo.inv.png';
import { SubSubTitle } from '../atoms/title';
import { Link } from '../atoms/link';
import { getLandingLogoGradient } from './landing.utils';
import { FormInput, FormSubmit } from './form';
import { SLOGAN } from '../const';

const style = {
  container: {
    position: 'relative',
  } as React.CSSProperties,
  containerProfile: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: '10px',
  } as React.CSSProperties,
  landing: {
    container: {
      backgroundImage: getLandingLogoGradient(),

      backgroundColor: '#ff0055',
      color: 'white',
      padding: '100px 0',
    } as React.CSSProperties,
    authMethodButton: {
      marginLeft: '10px',
      marginRight: '10px',
      padding: '30px',
      height: '30px',
      minHeight: '40px',
      width: '40px',
      minWidth: '40px',
    },
    logo: {
      backgroundImage: `url(${landingLogo})`,
      backgroundPosition: '100%',
      backgroundRepeat: 'no-repeat',
      backgroundSize: '460px 150px',
      height: '150px',
      minHeight: '150px',
      width: '460px',
      minWidth: '460px',
      filter: 'drop-shadow(0px 2px 1px rgba(0, 0, 0, .2))',
    },
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
    backgroundSize: '2030px 45px',
    height: '45px',
    minHeight: '45px',
    filter: 'drop-shadow(0px 2px 1px rgba(0, 0, 0, .2))',
  },
}

const authMethodTypeToLogoMap = {
  bitbucket: 'fa-brands fa-bitbucket fa-lg',
  default: 'fa-solid fa-arrow-right-to-bracket fa-lg',
  github: 'fa-brands fa-github fa-lg',
  gitlab: 'fa-brands fa-gitlab fa-lg',
  saml2: 'fa-solid fa-key fa-lg',
}

export const Landing = observer(({ store }: { store: RootStore }) => {
  if (store.isAuthorized === null) {
    return null;
  }

  const authMethodPassword = Object.values(rootStore.authMethods).find((authMethod) => authMethod.type === 'password');

  if (store.isAuthorized === false) {
    return <div style={ style.container }>
      <div className='flex flex-ver flex-middle children-gap' style={ style.landing.container }>
        <div style={ style.landing.logo } />
        <div className='pad-hor triple'>{ SLOGAN }</div>
      </div>
      <div className="container med ltr square pad-hor triple roof">
        {
          authMethodPassword
            ? <form className='paragraph'>
              <div className='row flex flex-center'>
                <FormInput className='transparent'
                  store={ store.authPasswordStore }
                  id='username'
                  x={ 4 } autoComplete='username' label='Username'
                />
              </div>
              <div className='row flex flex-center'>
                <FormInput className='transparent'
                  store={ store.authPasswordStore }
                  id='password'
                  x={ 4 } autoComplete='password' label='Password' type='password'
                />
              </div>
              <div className='row flex flex-center'>
                <FormSubmit
                  store={ store.authPasswordStore }
                  onClick={ () => store.authorizeByUsernamePassword(authMethodPassword.id) }
                  x={ 4 }
                >Login</FormSubmit>
              </div>
            </form>
            : null
        }
        <div className='flex flex-center paragraph paragraph-lrg'>
          {
            Object.values(rootStore.authMethods).map((authMethod) => {
              if (authMethod === authMethodPassword) {
                return null;
              }

              return <div className='center'>
                <button
                  className={ `button default transparent unbound ${authMethodTypeToLogoMap[authMethod.type] ?? authMethodTypeToLogoMap.default}` }
                  style={ style.landing.authMethodButton }
                  onClick={ () => store.authenticate(authMethod.id) }
                />
                {
                  authMethod.title
                    ? <span className='font-sml'>{ authMethod.title }</span>
                    : <span className='font-sml upper'>{ authMethod.id }</span>
                }
              </div>
            })
          }
        </div>
      </div>
    </div>;
  }

  return <div style={ style.container }>
    <div style={ style.logo } />
    <div className='flex flex-end' style={ style.containerProfile }>
      <div className="container med ltr square pad-hor triple h-auto">
        <div className='row flex flex-right'>
          <div className='c-6 flex flex-hor flex-right children-gap-hor'>
            <SubSubTitle className='w-auto'>
              <span style={ style.container }>{ store.user?.name ?? store.user?.id }</span>
            </SubSubTitle>
            <SubSubTitle className='w-auto'><Link activeClassName="link failure" className='link failure' onClick={ () => store.logout() }>
              <span style={ style.container }>Logout</span>
            </Link></SubSubTitle>
          </div>
        </div>
      </div>
    </div>
  </div>;
});
