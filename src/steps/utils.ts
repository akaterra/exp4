export function notEmptyArray(...args) {
  return args.find((arg) => Array.isArray(arg) && !!arg.length) ?? [];
}
