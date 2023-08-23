import React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { Link } from '../atoms/link';
import { observer } from 'mobx-react-lite';
import { ProjectStore } from '../stores/project';
import { ProjectTargetStateDto, ProjectTargetStreamStateDto } from '../stores/dto/project-target-stream.state';

export const ProjectTargerState = observer(({ project, stream }: { project: ProjectStore, stream: ProjectTargetStateDto }) => {
    return <div className='block'>
        <SubTitle>{ stream.id }</SubTitle>
        <SubSubTitle>Actions</SubSubTitle>
        <SubSubTitle>Actions</SubSubTitle>
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

export const ProjectState = observer(({ project }: { project: ProjectStore }) => {
    return <div className='block'>
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
