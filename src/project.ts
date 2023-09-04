import { ActionsService } from './actions.service';
import { IntegrationsService } from './integrations.service';
import { IIntegrationService } from './integrations/integration.service';
import { StoragesService } from './storages.service';
import { StreamsService } from './streams.service';
import { IStreamService } from './streams/stream.service';
import { TargetsService } from './targets.service';
import { VersioningsService } from './versionings.service';
import * as _ from 'lodash';
import Ajv from 'ajv';

const ajv = new Ajv();

export interface IProjectDef {
  id?: string;
  type: string;

  config?: any;
  title?: string;
  description?: string;
}

export interface IProjectVersioning {
  type: string;

  namespace?: string;
  storage?: string;
}

export interface IProjectFlowActionParam {
  type: string;

  title?: string;
  description?: string;

  constraints?: {
    enum?: any[];
    min?: number;
    minLength?: number;
    max?: number;
    maxLength?: number;
    optional?: boolean;
  };
  initialValue: any;
  validationSchema?: Record<string, any>;
}

export interface IProjectFlowActionStep<C extends (Record<string, unknown> | string) = string, T extends string = string> {
  id?: string;
  type: T;

  ref?: { flowId: string; projectId: string; };

  title?: string;
  description?: string;

  isDirty?: boolean;

  config?: C;
  params?: Record<string, IProjectFlowActionParam>;
  targets?: string[];
}

export interface IProjectFlowAction<C extends (Record<string, unknown> | string) = string, T extends string = string> {
  id?: string;
  type: T;

  ref?: { flowId: string; projectId: string; };

  title?: string;
  description?: string;

  isDirty?: boolean;

  steps?: IProjectFlowActionStep<C>[];
  params?: Record<string, IProjectFlowActionParam>;
  targets?: string[];
}

export type IProjectFlowActionDef = IProjectFlowAction<Record<string, unknown>>;

export interface IProjectFlow<C extends (Record<string, unknown> | string) = string> {
  id: string;
  type: string;

  ref?: { projectId: string; };

  title?: string;
  description?: string;

  isDirty?: boolean;

  actions: Record<string, IProjectFlowAction<C>>;
  targets: string[];
}

export type IProjectFlowDef = IProjectFlow<Record<string, unknown>>;

export interface IProjectTargetStream<C extends (Record<string, unknown> | string) = string, T extends string = string> {
  id?: string;
  type: T;

  ref?: { projectId: string; targetId: string; };

  title?: string;
  description?: string;

  isDirty?: boolean;

  config?: C;
  tags?: string[];
  targets?: string[];
}

export type IProjectTargetStreamDef = IProjectTargetStream<Record<string, unknown>>;

export interface IProjectTarget<C extends (Record<string, unknown> | string) = string> {
  id: string;
  type: string;

  ref?: { projectId: string; };

  title?: string;
  description?: string;

  isDirty?: boolean;

  streams: Record<string, IProjectTargetStream<C>>;
  tags?: string[];
  versioning?: string;
}

export type IProjectTargetDef = IProjectTarget<Record<string, unknown>>;

export interface IProject {
  id: string;
  type: string;

  title: string;
  descriptopn: string;

  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlow<Record<string, unknown>>>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTarget<Record<string, unknown>>>;
  versionings: Record<string, Record<string, unknown>>;
}

export interface IProjectInput {
  id: string;
  type: string;

  title: string;
  descriptopn: string;

  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlow>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTarget & { streams: Record<string, IProjectTargetStream & { use?: string }> }>;
  versionings: Record<string, IProjectDef>;
}

export class Project implements IProject {
  id: string = 'unknown';

  title: string;
  descriptopn: string;

  env: {
    actions: ActionsService;
    integrations: IntegrationsService;
    storages: StoragesService;
    streams: StreamsService;
    targets: TargetsService;
    versionings: VersioningsService;
  };

  definitions: Record<string, Record<string, unknown>> = {};
  flows: Record<string, IProjectFlowDef> = {};
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTargetDef> = {};
  versionings: Record<string, Record<string, unknown>>;

  get description() {
    return '';
  }

  get type() {
    return this.id;
  }

  constructor(config: Partial<IProjectInput & { env?: Project['env'] }>) {
    if (config.id) {
      this.id = config.id;
    }

    if (config.definitions) {
      this.definitions = config.definitions;
    }

    if (config.env) {
      this.env = config.env;
    }

    if (config.flows) {
      for (const [ key, def ] of Object.entries(config.flows)) {
        this.flows[key] = {
          id: key,
          type: 'flow',
          ref: { projectId: this.id },
          title: def.title,
          description: def.description,
          targets: def.targets ?? [],
          actions: Object
            .entries(def.actions ?? {})
            .reduce((acc, [ actKey, actDef ]) => {
              acc[actKey] = {
                id: actDef.id ?? actKey,
                type: actDef.type,
                ref: { flowId: key, projectId: this.id },
                title: actDef.title,
                description: actDef.description,
                params: actDef.params,
                steps: actDef.steps.map((step) => ({
                  id: step.id ?? actKey,
                  type: step.type,
                  ref: { flowId: key, projectId: this.id },
                  config: this.getDefinition(step.config),
                  description: step.description,
                  params: actDef.params
                    ? _.mapValues(actDef.params, (param) => {
                      param.validationSchema = this.getFlowActionParamValidationScheme(param);

                      return param;
                    })
                    : null,
                  targets: step.targets ?? actDef.targets ?? [],
                })),
              };

              return acc;
            }, {}),
        };
      }
    }

    if (config.targets) {
      for (const [ key, def ] of Object.entries(config.targets)) {
        this.targets[key] = {
          id: key,
          type: 'target',
          ref: { projectId: this.id },
          title: def.title,
          description: def.description,
          versioning: def.versioning,
          streams: Object
            .entries(def.streams ?? {})
            .reduce((acc, [ actKey, actDef ]) => {
              acc[actKey] = {
                id: actDef.id ?? actKey,
                type: actDef.type,
                ref: { projectId: this.id, targetId: key },
                config: this.getDefinition(actDef.config),
                title: actDef.title,
                description: actDef.description,
                tags: actDef.tags ?? [],
                targets: actDef.targets ?? [],
              };

              return acc;
            }, {}),
        };
      }
    }
  }

  getFlow(id: string): IProjectFlowDef {
    return this.flows[id];
  }

  getTargetByTargetId<S extends IProjectTargetDef = IProjectTargetDef>(id: string, unsafe?: boolean): S {
    const target = this.targets[id] as S;

    if (!target) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project target "${id}" not found`);
    }

    return target;
  }

  getTargetByTargetStream(stream: IProjectTargetStreamDef) {
    return this.getTargetByTargetId(stream.ref.targetId);
  }

  getTargetStreamByTargetIdAndStreamId<S extends IProjectTargetStream<Record<string, unknown>> = IProjectTargetStream<Record<string, unknown>>>(targetId: string, streamId: string, unsafe?: boolean): S {
    const stream = this.getTargetByTargetId(targetId).streams[streamId] as S;

    if (!stream) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project stream "${streamId}" not found`);
    }

    return stream;
  }

  getTargetVersioning(targetId: string, unsafe?: boolean): string {
    const versioning = this.getTargetByTargetId(targetId).versioning;

    if (versioning === undefined) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project target "${targetId}" versioning not found`);
    }

    return versioning;
  }

  // helpers

  getEnvActionByFlowActionStep(actionStep: IProjectFlowActionStep) {
    return this.env.actions.get(actionStep.type);
  }

  getEnvIntegraionByTargetIdAndStreamId(targetId: IProjectTargetDef['id'], streamId: IProjectTargetStreamDef['id']) {
    return this.getEnvIntegraionByTargetStream(this.getTargetStreamByTargetIdAndStreamId(targetId, streamId));
  }

  getEnvIntegraionByTargetStream<T extends IIntegrationService>(stream: IProjectTargetStreamDef) {
    return this.env.integrations.get<T>(stream.config?.integration as string);
  }

  getEnvStorageByStorageId(storageId: IProjectTargetDef['id']) {
    return this.env.storages.get(storageId);
  }

  getEnvStreamByTargetIdAndStreamId<T extends IStreamService>(targetId: IProjectTargetDef['id'], streamId: IProjectTargetStreamDef['id']): T {
    return this.env.streams.get(this.targets[targetId]?.streams[streamId]?.type) as T;
  }

  getEnvStreamByTargetStream<T extends IStreamService>(stream: IProjectTargetStreamDef): T {
    return this.env.streams.get(stream.type) as T;
  }

  getEnvVersioningByTargetId(targetId: IProjectTargetDef['id']) {
    return this.getEnvVersioningByTarget(this.getTargetByTargetId(targetId));
  }

  getEnvVersioningByTarget(target: IProjectTargetDef) {
    return this.env.versionings.get(target.versioning);
  }

  toJSON() {
    return {
      id: this.id,

      definitions: this.definitions,
      flows: this.flows,
      integrations: this.integrations,
      storages: this.storages,
      targets: this.targets,
      versionings: this.versionings,
    };
  }

  validateParams(flowId: IProjectFlowDef['id'], actionId: IProjectFlowActionDef['id'], params: Record<string, any>) {
    const action = this.getFlow(flowId)?.actions?.[actionId];

    if (action?.params) {
      const schema: Record<string, any> = {
        type: 'object',
        properties: {},
        required: [],
      };

      for (const [ key, param ] of Object.entries(action.params)) {
        if (param.validationSchema) {
          schema.properties[key] = param.validationSchema;
        }

        if (!param.constraints?.optional) {
          schema.required.push(key);
        }
      }

      const validate = ajv.compile(schema);
      const isValid = validate(params);

      if (!isValid) {
        throw new Error(`"${validate.errors[0].instancePath.slice(1)}" ${validate.errors[0].message}`);
      }
    }
  }

  private getDefinition(mixed: string | Record<string, unknown>): Record<string, unknown> {
    return typeof mixed === 'string'
      ? this.definitions[mixed] ?? {}
      : mixed ?? {};
  }

  private getFlowActionParamValidationScheme(action: IProjectFlowActionParam) {
    if (!action) {
      return;
    }

    const def: Record<string, any> = {};

    switch (action.type) {
    case 'number':
      def.type = 'number';

      if (typeof action.constraints?.min === 'number') {
        def.minimum = action.constraints?.min;
      }

      if (typeof action.constraints?.max === 'number') {
        def.maximum = action.constraints?.max;
      }

      break;
    case 'string':
      def.type = 'string';

      if (typeof action.constraints?.minLength === 'number') {
        def.minLength = action.constraints?.minLength;
      }

      if (typeof action.constraints?.maxLength === 'number') {
        def.maxLength = action.constraints?.maxLength;
      }

      break;
    }

    if (def.type && action.constraints?.enum) {
      def.enum = Array.isArray(action.constraints?.enum)
        ? action.constraints?.enum
        : [ action.constraints?.enum ];
    }

    return Object.keys(def).length ? def : null;
  }
}
