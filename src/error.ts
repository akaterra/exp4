export function createError(mixed, cause?) {
  let err = new Error();

  if (mixed instanceof Error) {
    err.message = mixed.message;
    err.stack = mixed.stack;
  }

  err.cause = cause ?? mixed.cause;

  return err;
}
