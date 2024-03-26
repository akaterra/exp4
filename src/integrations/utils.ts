import { resolvePlaceholders } from '../utils';

export function maybeReplaceEnvVars(val, returnNullOnEmpty = true) {
  return resolvePlaceholders(val, process.env, returnNullOnEmpty);
}
