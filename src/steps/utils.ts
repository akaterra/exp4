import { IProjectTargetDef, IProjectTargetStreamDef } from '../project';

export function notEmptyArray(...args) {
  return args.find((arg) => Array.isArray(arg) && !!arg.length) ?? [];
}

export function makeDirty(...entities: Array<IProjectTargetDef | IProjectTargetStreamDef>) {
  entities.forEach((entity) => {
    entity.isDirty = true;
  });
}
