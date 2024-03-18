import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import * as _ from 'lodash';

export function notEmptyArray(...args) {
  return args.find((arg) => Array.isArray(arg) && !!arg.length) ?? [];
}

export function makeDirty(...entities: Array<IProjectTargetDef | IProjectTargetStreamDef>) {
  entities.forEach((entity) => {
    entity.isDirty = true;
  });
}

export function getPossibleTargetIds(targetsStreams, flowTargetIds) {
  return (targetsStreams ? _.intersection(Object.keys(targetsStreams), flowTargetIds) : flowTargetIds) ?? [];
}
