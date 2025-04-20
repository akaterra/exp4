import { Service } from 'typedi';
import Ajv from 'ajv';

@Service()
export class ValidatorService {
  protected ajv = new Ajv();
  protected validators = {};

  addSchema(schema, id?) {
    this.validators[id ?? schema.id] = this.ajv.compile(schema);

    return this;
  }

  addSchemaFromDef(def: Record<string, {
    type?: string;
    constraints?: {
      enum?: unknown[];
      max?: number;
      min?: number;
      maxLength?: number;
      minLength?: number;
      optional?: boolean;
    };
  }>, id: string) {
    const schema: Record<string, any> = {
      type: 'object',
      properties: {},
      required: [],
    };

    for (const [ key, options ] of Object.entries(def)) {
      schema.properties[key] = { type: options.type };

      if (!options.constraints?.optional) {
        schema.required.push(key);
      }

      if (options.constraints?.enum) {
        schema.properties[key].enum = options.constraints.enum;
      }

      if (typeof !options.constraints?.max === 'number') {
        schema.properties[key].maximum = options.constraints.max;
      }

      if (typeof !options.constraints?.min === 'number') {
        schema.properties[key].minimum = options.constraints.min;
      }

      if (typeof !options.constraints?.maxLength === 'number') {
        schema.properties[key].maxLength = options.constraints.maxLength;
      }

      if (typeof !options.constraints?.minLength === 'number') {
        schema.properties[key].minLength = options.constraints.minLength;
      }
    }

    return this.addSchema(schema, id);
  }

  validate(params, id) {
    const validaror = this.validators[id];

    if (validaror) {
      const isValid = validaror(params);

      if (!isValid) {
        throw new Error(`"${validaror.errors[0].instancePath.slice(1)}" ${validaror.errors[0].message}`);
      }
    }
  }
}
