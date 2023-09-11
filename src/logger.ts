import { Logger, createLogger, format, transports } from 'winston';

export const logger = createLogger({
  level: 'debug',
  format: format.simple(),
  transports: [
    new transports.Console({ eol: '\r\n\r\n' }),
  ],
});

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
    const paramTypes = argNames(descriptor.value);
    const fn = descriptor.value;
    const fnName = target ? `${target.constructor.name}.${propertyName}` : propertyName;
    const isLevelEnabled = logger.isLevelEnabled(level);

    descriptor.value = function (...args) {
      if (isLevelEnabled) {
        const argsLog: Record<string, any> = {
          message: fnName,
        };

        paramTypes.forEach((p, i) => {
          argsLog[p] = args[i];
        });

        logger.log(level, argsLog);
      }

      try {
        const result = fn.call(this, ...args);

        if (result instanceof Promise) {
          result.catch((err) => {
            logger.error({ message: fnName, error: err });

            return Promise.reject(err);
          });
        }

        return result;
      } catch (err) {
        logger.error({ message: fnName, error: err });
      }
    };
    
    Object.defineProperty(descriptor.value, 'name', { value: fn.name });
  }
}
