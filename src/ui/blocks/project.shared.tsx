import * as React from 'react';
import { ProjectTargetStore } from '../stores/project';
import { Button } from '../atoms/button';

export const ProjectTargetStreamInfoButton = ({ projectTarget, streamState }: { projectTarget?: ProjectTargetStore, streamState }) => {
  return <Button
    className={ `button-sml ${streamState._label ?? ''} w-auto` }
    x={null}
    onClick={() => projectTarget.applyTargetStreamDetails(streamState.id)}
  >Info</Button>;
};

export const ProjectTargetStreamTitle = ({ projectTarget, stream, streamState }: { projectTarget?: ProjectTargetStore, stream, streamState }) => {
  return <span className={ `span ${streamState._label} overflow` }>
    { stream.title ?? stream.id }
    &nbsp;
    <span className='font-sml sup'>{streamState?.version}</span>
  </span>;
}
