import { CallbacksContainer } from './utils';

export interface IService {
  id: string;

  title?: string;
  description?: string;

  readonly assertType: string;
  readonly type: string;
}

export interface IEntityService extends IService {
  events: Record<string, boolean>;
  registerCallbacks(callbacks: CallbacksContainer): void;
  registerEvents(events: Record<string, boolean> | string[]): void;
}

export class EntityService {
  static readonly assertType: string = null;
  static readonly type: string = 'unknown';

  id: string;

  title: string;
  description: string;

  events: Record<string, boolean> = {};

  private _context: Record<string, unknown>;

  get assertType() {
    return (this.constructor as any).assertType ?? (this.constructor as any).type;
  }

  get context() {
    const context = this._context;
    this._context = null;

    return context;
  }

  get type() {
    return (this.constructor as any).type;
  }

  registerCallbacks(callbacks: CallbacksContainer) { // eslint-disable-line

  }

  registerEvents(events: Record<string, boolean> | string[]) {
    if (Array.isArray(events)) {
      events.forEach((event) => {
        this.events[event] = true;
      });
    } else {
      Object.keys(events).forEach((event) => {
        this.events[event] = events[event];
      });
    }
  }

  withContext(context) {
    this._context = context;

    return this;
  }
}

export class EntitiesService<T extends IService = IService> {
  protected entities: Record<string, T> = {};

  get domain() {
    return 'Unknown';
  }

  assertTypes(assertTypeA: T['type'], assertTypeB: T['type'], assertTypeNonStrict: boolean = true, id?: T['id']) {
    if (assertTypeA != null && assertTypeB != null && assertTypeA !== '*' && assertTypeB !== '*') {
      if (assertTypeB !== assertTypeA) {
        if (assertTypeNonStrict && assertTypeB.slice(0, assertTypeA.length) === assertTypeA) {
          return;
        }

        throw new Error(`${this.domain} requested entity "${id ?? '?'}" (${assertTypeA}) with incompatible type "${assertTypeB}"`);
      }
    }
  }

  get(id: string, assertType: T['type'] = null, assertTypeNonStrict: boolean = true, unsafe: boolean = false): T {
    const entity = this.entities[id];

    if (!entity) {
      if (unsafe) {
        return null;
      }

      throw new Error(`${this.domain} "${id ?? '?'}" not found`);
    }

    if (assertType !== null) {
      this.assertTypes(assertType, entity.assertType, assertTypeNonStrict);
    }

    return entity;
  }

  has(id: string): boolean {
    return this.entities.hasOwnProperty(id);
  }

  add(entity: T, id?: string, title?: string, description?: string) {
    this.entities[id ?? entity.type] = entity;

    if (id) {
      entity.id = id;
    }

    if (title) {
      entity.title = title;
    }

    if (description) {
      entity.description = title;
    }

    return this;
  }
}

export class EntitiesServiceWithFactory<T extends IService = IService> extends EntitiesService<T> {
  protected factories: Record<string, { new (...args): T, type: string }> = {};

  addFactory(cls: { new (...args): T, type: string }) {
    this.factories[cls.type] = cls;

    return this;
  }

  getInstance(type: string, ...args): T {
    if (!this.factories[type]) {
      throw new Error(`${this.domain} "${type}" is not registered`);
    }

    return new this.factories[type](...args);
  }
}
