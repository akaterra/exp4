export interface IService {
  readonly description: string;
  readonly type: string;
}

export class EntityService {
  static readonly type: string = 'unknown';

  get description() {
    return '';
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

  get(id: string): T {
    const entity = this.entities[id];

    if (!entity) {
      throw new Error(`${this.domain} "${id ?? '?'}" not found`);
    }

    return entity;
  }

  add(entity: T, id?: string) {
    this.entities[id ?? entity.type] = entity;

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
