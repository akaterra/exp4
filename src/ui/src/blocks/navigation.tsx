import React, { Fragment } from 'react';
import { SubTitle } from '../atoms/title';
import { NavLink } from '../atoms/link';
import { ProjectsStore } from '../stores/projects';
import { observer } from 'mobx-react-lite';
import { RootStore } from '../stores/root';

export const Navigation = observer(({ projects, root }: { projects: ProjectsStore, root: RootStore }) => {
  // bootstrap, app loading
  if (root.isAuthorized === null) {
    return null;
  }

  if (root.isAuthorized === false) {
    return <div className='block no-scroll children-gap'>
      {/* <div>
        <SubTitle><Link activeClassName="link active" href={ root.authMethods?.github?.actions?.redirect } className='link'>
          Login
        </Link></SubTitle>
      </div> */}
    </div>;
  }

  return <div className='block no-scroll children-gap'>
    <div>
      <SubTitle><NavLink activeClassName="link active" href='/statistics' className='link'>
        Statistics
      </NavLink></SubTitle>
      <SubTitle>Projects</SubTitle>
      <div className='list'>
        {
          projects.projectsList.map((e, i) => {
            return <Fragment key={ i }>
              <div className='list-item bold'>
                <NavLink activeClassName='link active' href={ `/projects/${e.id}` } className='link'>{ e.title ?? e.id }</NavLink>
              </div>
              <div className='list-item sub bold'>
                <NavLink activeClassName='link active' href={ `/projects/${e.id}/targets` } className='link'>Targets</NavLink>
              </div>
              <div className='list-item sub bold'>
                <NavLink activeClassName='link active' href={ `/projects/${e.id}/statistics` } className='link'>Statistics</NavLink>
              </div>
            </Fragment>;
          })
        }
      </div>
    </div>
    {/* <div>
      <SubTitle><Link activeClassName="link failure" className='link failure' onClick={ () => rootStore.logout() }>
        Logout
      </Link></SubTitle>
    </div> */}
  </div>;
});
