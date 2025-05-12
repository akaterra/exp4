import { IProjectTargetStreamDef } from '../project';

export function getKey(key: string | string[], unsafe?: boolean): string {
  assertKeyParts(key, unsafe);

  key = Array.isArray(key) ? key.join('__') : key;

  return `sf__${key}`.toLowerCase().replace(/[\-\.]/g, '_');
}

export function getKeyOfType(key: string | string[], id: IProjectTargetStreamDef['id'], type?: string, unsafe?: boolean): string {
  assertKeyParts(key, unsafe);

  key = Array.isArray(key) ? key.join('__') : key;

  return `sf__${key}__${type ?? 'stream'}__${id}`.toLowerCase().replace(/[\-\.]/g, '_');
}

function assertKeyParts(key: string | string[], unsafe?: boolean) {
  if (unsafe) {
    return;
  }

  if (Array.isArray(key) && key.some((k) => k == null)) {
    throw new Error('Key part cannot be null or undefined');
  }

  if (key == null) {
    throw new Error('Key part cannot be null or undefined');
  }
}
