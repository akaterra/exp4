import { createLogger, format, transports } from 'winston';
import { IS_TEST } from './utils';

export const logger = createLogger({
  level: 'debug',
  format: format.simple(),
  transports: [
    new transports.Console({ eol: '\r\n\r\n' }),
  ],
});

export function logError(err, message = 'error', extra?: Record<string, any>) {
  console.error(err)
  logger.error({ message, error: err?.error ?? err?.message ?? err, stack: err?.stack, ...extra });
}

export function logErrorWarn(err, message = 'warn', extra?: Record<string, any>) {
  logger.warn({ message, error: err?.error ?? err?.message ?? err, stack: err?.stack, ...extra });
}

function argNames(fn) {
  return (fn + '')
    .replace(/[/][/].*$/mg,'') // strip single-line comments
    .replace(/\s+/g, '') // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments  
    .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters  
    .replace(/=[^,]+/g, '') // strip any ES6 defaults  
    .split(',').filter(Boolean); // split & filter [""]
}

export function Log(level: string = logger.level) {
  return (target, propertyName, descriptor) => {
    if (IS_TEST) {
      return;
    }

    const paramTypes = argNames(descriptor.value);
    const fn = descriptor.value;
    const fnName = target ? `${target.constructor.name}.${propertyName}` : propertyName;
    const isLevelEnabled = logger.isLevelEnabled(level);

    descriptor.value = function (...args) {
      if (isLevelEnabled) {
        if (paramTypes?.length) {
          const argsLog: Record<string, any> = {
            message: fnName,
          };

          paramTypes.forEach((p, i) => {
            argsLog[p] = args[i];
          });

          logger.log(level, argsLog);
        } else {
          logger.log(level, args);
        }
      }

      try {
        const result = fn.call(this, ...args);

        if (result instanceof Promise) {
          result.catch((err) => {
            logError(err, fnName);

            return Promise.reject(err);
          });
        }

        return result;
      } catch (err) {
        logError(err, fnName);
      }
    };
    
    Object.defineProperty(descriptor.value, 'name', { value: fn.name });
  }
}
