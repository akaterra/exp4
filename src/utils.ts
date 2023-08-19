import Container from 'typedi';
import * as _ from 'lodash';

export function Autowired(name?: any | (() => any)) {
  return function(target: Object, propertyName: string){
    if (typeof name === 'function') {
      name = name();
    }

    target[propertyName] = Container.get(name ?? Reflect.getMetadata('design:type', target, propertyName));
  }
}

export function *iter(iterable): Generator<any> {
  if (Array.isArray(iterable)) {
    let i = 0;

    for (const item of iterable) {
      yield [ i, item ];

      i += 1;
    }
  } else {
    yield [ 0, iterable ];
  }
}

export function resolvePlaceholders(template, params) {
  return template.replace(/\$\{([\w\|\.]+)\}/g, (all, p1) => {
    const keys = p1.split('|');

    if (keys.length < 2) {
      return _.get(params, p1, '');
    }

    for (let i = 0, l = keys.length; i < l; i += 1) {
      if (i === l - 1) {
        return keys[i];
      }

      if (_.has(params, keys[i])) {
        const val = _.get(params, keys[i]);

        if (val === '' || val === null) {
          continue;
        }

        return val;
      }
    }
  });
}
