import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import * as _ from 'lodash';

export function notEmptyArray(...args) {
  return args.find((arg) => Array.isArray(arg) && !!arg.length) ?? [];
}

export function markDirty(...entities: Array<IProjectTargetDef | IProjectTargetStreamDef>) {
  entities.forEach((entity) => {
    entity.isDirty = true;
  });
}

export function getPossibleTargetIds(targetsStreams, flowTargetIds: IProjectTargetDef['id'][]) {
  const targetIds = targetsStreams ? Object.keys(targetsStreams) : null;

  return (targetIds?.length ? _.intersection(targetIds, flowTargetIds) : flowTargetIds) ?? [];
}
