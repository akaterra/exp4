import * as React from 'react';
import { SubSubTitle, SubTitle, Title } from '../atoms/title';
import { Link } from '../atoms/link';
import { observer } from 'mobx-react-lite';
import { ProjectStore, ProjectTargetStore } from '../stores/project';
import { ProjectTargetStateDto, ProjectTargetStreamStateDto } from '../stores/dto/project-state';
import { Splitter } from '../atoms/splitter';
import { Label } from '../atoms/label';
import { Checkbox } from '../atoms/input';
import { Overlay } from '../atoms/overlay';
import { Button } from '../atoms/button';
import { Panel } from '../atoms/panel';

const style = {
    projectTarget: {
        width: '25%',
    },
};

export const ProjectTargetStream = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
    const selectedStreamWithState = projectTarget?.projectStore?.selectedStreamWithState;
    const lastChange = selectedStreamWithState?.streamState?.history?.change?.[0];

    return <div className='flex h-100'>
        <div className='c14 c10-m- clear'></div>
        <div className='c-4 c-8-m- clear back-light h-100 shadow shadow-low'>
            <div className='paragraph paragraph-lrg'>
                <div className='panel unbound transparent clear'>
                    <div className='c18 children-gap'>
                        <div>
                            <div className='flex flex-hor'>
                                <SubTitle>
                                    { selectedStreamWithState?.stream?.title ?? selectedStreamWithState?.stream?.id }
                                    &nbsp;
                                    <span className='font-sml sup'>{ selectedStreamWithState?.streamState?.version }</span>
                                </SubTitle>
                                <Button className='button-sml default transparent w-auto' x={ null } onClick={ () => projectTarget?.selectStream(null) }>✖</Button>
                            </div>
                            <Label>{ selectedStreamWithState?.stream?.description ?? 'No description' }</Label>
                        </div>
                        <a className='link' href={ selectedStreamWithState?.streamState?.link } target='__blank'>{ selectedStreamWithState?.streamState?.type }</a>
                        <div>Target: { projectTarget?.target?.title ?? projectTarget?.target?.id }</div>
                        {
                            selectedStreamWithState?.streamState?.history?.action?.length
                                ? <div>
                                    <SubSubTitle>Last action</SubSubTitle>
                                </div>
                                : null
                        }
                        {
                            selectedStreamWithState?.streamState?.history?.change?.length
                                ? <React.Fragment>
                                    <div>
                                        <SubSubTitle>Last change</SubSubTitle>
                                        <Label>{ lastChange?.description ?? 'No description' }</Label>
                                    </div>
                                    <a className='link' href={ lastChange?.link } target='__blank'>{ lastChange?.type }</a>
                                    <div>Author: <a className='link' href={ lastChange?.author?.link }>{ lastChange?.author?.name ?? 'Unknown' }</a></div>
                                    { lastChange?.time && <div>{ lastChange?.time }</div> }
                                </React.Fragment>
                                : null
                        }
                    </div>
                </div>
            </div>
        </div>
    </div>;
});

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
                projectTarget.actions.map((action) => {
                    return <div>
                        <button className='button button-sml success auto'>{ action.title ?? action.id }</button>
                    </div>;
                })
            }
        </div>
        <div>
            {
                projectTarget.streamsWithStates.map(({ stream, streamState }) => {
                    return <div>
                        <Checkbox>
                            <div>
                                <div>
                                    { stream.title ?? stream.id }
                                    &nbsp;
                                    <span className='font-sml sup'>{ streamState?.version }</span>
                                </div>
                            </div>
                        </Checkbox>
                        <Button className='button-sml default auto' x={ null } onClick={ () => projectTarget.selectStream(stream.id) }>Info</Button>
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
        {
            project.selectedStreamWithState
                ? <Overlay isShown={ true }>
                    <ProjectTargetStream projectTarget={ project.selectedStreamWithState.targetStore } />
                </Overlay>
                : null
        }
        <SubTitle>{ project.project?.title ?? project.project?.id }</SubTitle>
        <Label>{ project.project?.description ?? 'No description' }</Label>
        <div className='row paragraph'>
            {
                Object.values(project.projectTargetsStores).map((projectTargetStore) => {
                    return <div className='ccc -s-' style={ style.projectTarget }>
                        <div className='panel primary shadow shadow-low unbound'>
                            <ProjectTarget projectTarget={ projectTargetStore } />
                        </div>
                    </div>;
                })
            }
        </div>
    </div>;
});
