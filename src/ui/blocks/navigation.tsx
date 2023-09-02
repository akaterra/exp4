import React from 'react';
import { SubTitle, Title } from '../atoms/title';
import { Link, NavLink } from '../atoms/link';
import { ProjectsStore } from '../stores/projects';
import { observer } from 'mobx-react-lite';
import { RootStore, rootStore } from '../stores/root';

export const Navigation = observer(({ projects, root }: { projects: ProjectsStore, root: RootStore }) => {
    // bootstrap, app loading
    if (root.isAuthorized === null) {
        return null;
    }

    if (root.isAuthorized === false) {
        return <div className='block no-scroll children-gap'>
            <div>
                <SubTitle><Link activeClassName="link active" href={ root.authMethods?.github?.actions?.redirect } className='link'>
                    Login
                </Link></SubTitle>
            </div>
        </div>;
    }

    return <div className='block no-scroll children-gap'>
        <div>
            <Title>Projects</Title>
            {
                projects.projectsList.map((e, i) => {
                    return <SubTitle key={ i }><NavLink activeClassName="link active" href={ `/projects/${e.id}` } className='link'>
                        { e.id }
                    </NavLink></SubTitle>
                })
            }
        </div>
        <div>
            <SubTitle><Link activeClassName="link failure" className='link failure' onClick={ () => rootStore.logout() }>
                Logout
            </Link></SubTitle>
        </div>
    </div>;
});
