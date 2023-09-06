export interface IService {
  id: string;
  readonly assertType: string;
  readonly description: string;
  readonly type: string;
}

export class EntityService {
  static readonly assertType: string = null;
  static readonly type: string = 'unknown';

  id: string;

  get description() {
    return '';
  }

  get assertType() {
    return (this.constructor as any).assertType ?? (this.constructor as any).type;
  }

  get type() {
    return (this.constructor as any).type;
  }
}

export class EntitiesService<T extends EntityService = EntityService> {
  protected entities: Record<string, T> = {};

  get domain() {
    return 'Unknown';
  }

  get(id: string, assertType?: T['type'], assertTypeNonStrict?: boolean): T {
    const entity = this.entities[id];

    if (!entity) {
      throw new Error(`${this.domain} "${id ?? '?'}" not found`);
    }

    if (assertType && entity.assertType !== assertType && entity.assertType !== '*') {
      if (
        (assertTypeNonStrict && entity.assertType.slice(0, assertType.length) !== assertType) ||
        (entity.assertType !== assertType)
      ) {
        throw new Error(`${this.domain} requested entity "${id}" (${assertType}) with incompatible type (${entity.type})`);
      }
    }

    return entity;
  }

  add(entity: T, id?: string) {
    this.entities[id ?? entity.type] = entity;

    if (id) {
      entity.id = id;
    }

    return this;
  }
}

export class EntitiesServiceWithFactory<T extends EntityService = EntityService> extends EntitiesService<T> {
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
