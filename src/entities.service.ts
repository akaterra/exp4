import { ProjectsService } from "./projects.service";
import { Autowired } from "./utils";

export interface IService {
  id: string;

  title: string;
  description: string;

  readonly assertType: string;
  readonly type: string;
}

export class EntityService {
  static readonly assertType: string = null;
  static readonly type: string = 'unknown';

  @Autowired(() => ProjectsService) protected projectsService: ProjectsService;

  id: string;

  title: string;
  description: string;

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

        throw new Error(`${this.domain} requested entity "${id ?? '?'}" (${assertTypeA}) with incompatible type (${assertTypeB})`);
      }
    }
  }

  get(id: string, assertType: T['type'] = null, assertTypeNonStrict: boolean = true): T {
    const entity = this.entities[id];

    if (!entity) {
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
