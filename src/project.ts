import { ActionsService } from './actions.service';
import { IntegrationsService } from './integrations.service';
import { IIntegrationService } from './integrations/integration.service';
import { StoragesService } from './storages.service';
import { StreamsService } from './streams.service';
import { IStreamService } from './streams/stream.service';
import { TargetsService } from './targets.service';
import { VersioningsService } from './versionings.service';

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

export interface IProjectFlowActionStep<C extends (Record<string, unknown> | string) = string, T extends string = string> {
  id?: string;
  type: T;

  ref?: { flowId: string; projectId: string; };

  title?: string;
  description?: string;

  isDirty?: boolean;

  config?: C;
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
  versioning?: string;
}

export type IProjectTargetDef = IProjectTarget<Record<string, unknown>>;

export interface IProject {
  name: string;

  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlow<Record<string, unknown>>>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTarget<Record<string, unknown>>>;
  versionings: Record<string, Record<string, unknown>>;
}

export interface IProjectInput {
  name: string;

  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlow>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTarget>;
  versionings: Record<string, IProjectDef>;
}

export class Project implements IProject {
  name: string = 'unknown';

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
    return this.name;
  }

  constructor(config: Partial<IProjectInput & { env?: Project['env'] }>) {
    if (config.name) {
      this.name = config.name;
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
          ref: { projectId: this.name },
          title: def.title,
          description: def.description,
          targets: def.targets ?? [],
          actions: Object
            .entries(def.actions ?? {})
            .reduce((acc, [ actKey, actDef ]) => {
              acc[actKey] = {
                id: actDef.id ?? actKey,
                type: actDef.type,
                ref: { flowId: key, projectId: this.name },
                title: actDef.title,
                description: actDef.description,
                steps: actDef.steps.map((step) => ({
                  id: step.id ?? actKey,
                  type: step.type,
                  ref: { flowId: key, projectId: this.name },
                  config: this.getDefinition(step.config),
                  description: step.description,
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
          ref: { projectId: this.name },
          title: def.title,
          description: def.description,
          versioning: def.versioning,
          streams: Object
            .entries(def.streams ?? {})
            .reduce((acc, [ actKey, actDef ]) => {
              acc[actKey] = {
                id: actDef.id ?? actKey,
                type: actDef.type,
                ref: { projectId: this.name, targetId: key },
                config: this.getDefinition(actDef.config),
                title: actDef.title,
                description: actDef.description,
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

  getEnvStreamByTargetIdAndStreamId<T extends IStreamService>(targetId: IProjectTargetDef['id'], streamId: IProjectTargetStreamDef['id']) {
    return this.env.streams.get(this.targets[targetId]?.streams[streamId]?.type);
  }

  getEnvStreamByTargetStream<T extends IStreamService>(stream: IProjectTargetStreamDef) {
    return this.env.streams.get(stream.type);
  }

  getEnvVersioningByTargetId(targetId: IProjectTargetDef['id']) {
    return this.getEnvVersioningByTarget(this.getTargetByTargetId(targetId));
  }

  getEnvVersioningByTarget(target: IProjectTargetDef) {
    return this.env.versionings.get(target.versioning);
  }

  toJSON() {
    return {
      id: this.name,

      definitions: this.definitions,
      flows: this.flows,
      integrations: this.integrations,
      storages: this.storages,
      targets: this.targets,
      versionings: this.versionings,
    };
  }

  private getDefinition(mixed: string | Record<string, unknown>): Record<string, unknown> {
    return typeof mixed === 'string'
      ? this.definitions[mixed] ?? {}
      : mixed ?? {};
  }
}
