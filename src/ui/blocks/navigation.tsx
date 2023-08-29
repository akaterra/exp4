import React from 'react';
import { SubTitle, Title } from '../atoms/title';
import { Link } from '../atoms/link';
import { ProjectsStore } from '../stores/projects';
import { observer } from 'mobx-react-lite';
import { RootStore } from '../stores/root';

export const Navigation = observer(({ projects, root }: { projects: ProjectsStore, root: RootStore }) => {
    return <div className='block no-scroll'>
        <SubTitle><Link activeClassName="link active" href="statistics" className='link'>
            Statistics
        </Link></SubTitle>
        <Title>Projects</Title>
        {
            projects.projectsList.map((e, i) => {
                return <SubTitle key={ i }><Link activeClassName="link active" href={ `projects/${e.id}` } className='link'>
                    { e.id }
                </Link></SubTitle>
            })
        }
    </div>;
});
