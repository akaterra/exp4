import * as React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { Label } from '../atoms/label';
import { Checkbox } from '../atoms/input';
import { Button } from '../atoms/button';
import {Status} from '../enums/status';

export const ProjectTarget = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
    if (!projectTarget?.target?.id) {
        return null;
    }

    return <div className='children-gap'>
        <div>
            <SubTitle>
                { projectTarget.target?.title ?? projectTarget.target?.id }
                &nbsp;
                <span className='font-sml sup'>{ projectTarget.targetState?.projectTargetState?.version }</span>
            </SubTitle>
            <Label>{ projectTarget.target?.description ?? 'No description' }</Label>
        </div>
        <div>
            {
                projectTarget.actions.map((action, i) => {
                    return <div key={ i }>
                        <Button className='button-sml success auto' x={ null } onClick={ () => projectTarget.applyRunAction(null, action.id) }>{ action.title ?? action.id }</Button>
                    </div>;
                })
            }
        </div>
        <div>
            {
                projectTarget.streamsWithStates.map(({ stream, streamState, isSelected }, i) => {
                    const lastAction = streamState?.history?.action?.[0];
                    const lastChange = streamState?.history?.change?.[0];
                    const isFailed = lastAction?.status === Status.FAILED || lastChange?.status === Status.FAILED;

                    return <div key={ i } className={ lastChange ? '' : 'opacity-med' }>
                        <Checkbox
                            currentValue={ isSelected }
                            onChange={ () => projectTarget.applyStreamSelection(stream.id) }
                        >
                            <div>
                                <div>
                                    { stream.title ?? stream.id }
                                    &nbsp;
                                    <span className='font-sml sup'>{ streamState?.version }</span>
                                </div>
                            </div>
                        </Checkbox>
                        <Button
                            className={ isFailed ? 'button-sml failure auto' : 'button-sml default auto' }
                            x={ null }
                            onClick={ () => projectTarget.applyTargetStreamDetails(stream.id) }
                        >Info</Button>
                    </div>;
                })
            }
        </div>
    </div>;
});

export const Project = observer(({ project }: { project?: ProjectStore }) => {
    if (!project?.project?.id) {
        return null;
    }

    return <div>
        <SubTitle>{ project.project?.title ?? project.project?.id }</SubTitle>
        <Label>{ project.project?.description ?? 'No description' }</Label>
        <div className='row paragraph'>
            {
                Object.values(project.projectTargetsStores).map((projectTargetStore) => {
                    return <div className='ccc -s- w25'>
                        <div className='panel primary shadow shadow-low unbound'>
                            <ProjectTarget projectTarget={ projectTargetStore } />
                        </div>
                    </div>;
                })
            }
        </div>
    </div>;
});