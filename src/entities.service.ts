export interface IService {
  readonly type: string;
}

export class EntityService {
  static readonly type: string = 'unknown';

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
