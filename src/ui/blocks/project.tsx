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
import { DetailsPanel } from '../atoms/details-panel';
import { Modal } from '../atoms/modal';

const style = {
    projectTarget: {
        width: '25%',
    },
};

export const ProjectTargetStreamActionModal = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
    const selectedAction = projectTarget?.projectStore?.selectedAction;

    return <Modal
        title={
            <React.Fragment>
                { selectedAction?.action?.title }
                &nbsp;
                <span className='font-sml sup'>{ selectedAction?.action?.description }</span>
            </React.Fragment>
        }
        onClose={ () => projectTarget?.selectAction(null, null) }
    >
            <div>
                <Button.Failure>A</Button.Failure>
                <Button>B</Button>
            </div>
    </Modal>
});

export const ProjectTargetStreamModal = observer(({ projectTarget }: { projectTarget?: ProjectTargetStore }) => {
    const selectedStreamWithState = projectTarget?.projectStore?.selectedStreamWithState;
    const lastChange = selectedStreamWithState?.streamState?.history?.change?.[0];

    return <DetailsPanel
        title={
            <React.Fragment>
                { selectedStreamWithState?.stream?.title ?? selectedStreamWithState?.stream?.id }
                &nbsp;
                <span className='font-sml sup'>{ selectedStreamWithState?.streamState?.version }</span>
            </React.Fragment>
        }
        titleContent={
            <Label>{ selectedStreamWithState?.stream?.description ?? 'No description' }</Label>
        }
        onClose={ () => projectTarget?.selectStream(null) }
    >
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
        <div>
            {
                projectTarget?.actions.map((action, i) => {
                    return <div key={ i }>
                        <Button
                            className='button-sml success auto'
                            x={ null }
                            onClick={ () => projectTarget.selectAction(selectedStreamWithState?.stream?.id!, action.id) }
                        >{ action.title ?? action.id }</Button>
                    </div>;
                })
            }
        </div>
    </DetailsPanel>;
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
                projectTarget.actions.map((action, i) => {
                    return <div key={ i }>
                        <button className='button button-sml success auto'>{ action.title ?? action.id }</button>
                    </div>;
                })
            }
        </div>
        <div>
            {
                projectTarget.streamsWithStates.map(({ stream, streamState }, i) => {
                    return <div key={ i }>
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
            project.selectedAction
                ? <ProjectTargetStreamActionModal projectTarget={ project.selectedAction.targetStore } />
                : null
        }
        {
            project.selectedStreamWithState
                ? <ProjectTargetStreamModal projectTarget={ project.selectedStreamWithState.targetStore } />
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
