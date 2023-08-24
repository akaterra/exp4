import React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { Link } from '../atoms/link';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { ProjectTargetStateDto, ProjectTargetStreamStateDto } from '../stores/dto/project-target-stream.state';

export const ProjectTarget = observer(({ projectTarget }: { projectTarget: ProjectTargetStore }) => {
    return <div className='block'>
        <SubTitle>{ projectTarget.target.id }</SubTitle>
        <SubSubTitle>Actions</SubSubTitle>
        {
            
        }
        <SubSubTitle>Targets</SubSubTitle>
    </div>;
});

export const Project = observer(({ project }: { project: ProjectStore }) => {
    return <div className='block'>
        <SubTitle>{ project.project.id }</SubTitle>
        <div className='row'>
            {
                Object.values(project.projectTargetsStores).map((projectTargetStore) => <ProjectTarget projectTarget={ projectTargetStore } />)
            }
        </div>
    </div>;
});
