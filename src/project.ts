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
import { ArtifactsService } from './artifacts.service';
import { ProjectsService } from './projects.service';
import { Autowired } from './utils';
import { IStream } from './stream';
import { ProjectState } from './project-state';

const ajv = new Ajv();

export interface IProjectDef<C extends Record<string, any> | string = Record<string, any>, T extends string = string> {
  id?: string;
  type: T;

  title?: string;
  description?: string;

  isSyncing?: boolean;
  ref?: IProjectRef;

  config?: C;
}

export interface IProjectRef {
  actionId?: IProjectFlowAction['id'],
  projectId?: IProject['id'],
  flowId?: IProjectFlow['id'],
  streamId?: IProjectTargetStream['id'],
  targetId?: IProjectTarget['id'],
}

export interface IProjectArtifact<C extends Record<string, any> = Record<string, any>> extends IProjectDef<C> {
  dependsOn?: IProjectArtifact['id'][];
  ref?: IProjectRef;
}

export interface IProjectVersioning<T extends string = string> extends IProjectDef<unknown, T> {
  namespace?: string;
  storage?: string;
}

export interface IProjectFlowActionParam extends IProjectDef {
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

export interface IProjectFlowActionStep<C extends (Record<string, unknown> | string) = string, T extends string = string> extends IProjectDef<C, T> {
  isDirty?: boolean;

  params?: Record<string, IProjectFlowActionParam>;
  targets?: IProjectTarget['id'][];
}

export interface IProjectFlowAction<C extends (Record<string, unknown> | string) = string, T extends string = string> extends IProjectDef<unknown, T> {
  isDirty?: boolean;

  artifacts?: IProjectArtifact['id'][];
  steps?: IProjectFlowActionStep<C>[];
  params?: Record<string, IProjectFlowActionParam>;
  targets?: IProjectTarget['id'][];
}

export type IProjectFlowActionDef = IProjectFlowAction<Record<string, unknown>>;

export interface IProjectFlow<C extends (Record<string, unknown> | string) = string> extends IProjectDef {
  isDirty?: boolean;

  actions: Record<string, IProjectFlowAction<C>>;
  targets: IProjectTarget['id'][];
}

export type IProjectFlowDef = IProjectFlow<Record<string, unknown>>;

export interface IProjectTargetStream<C extends (Record<string, unknown> | string) = string, T extends string = string> extends IProjectDef<unknown, T> {
  isDirty?: boolean;

  artifacts?: IProjectArtifact['id'][];
  config?: C;
  tags?: string[];
  targets?: IProjectTarget['id'][];
}

export type IProjectTargetStreamDef = IProjectTargetStream<Record<string, unknown>>;

export interface IProjectTarget<C extends (Record<string, unknown> | string) = string> extends IProjectDef {
  isDirty?: boolean;

  artifacts?: IProjectArtifact['id'][];
  streams: Record<string, IProjectTargetStream<C>>;
  tags?: string[];
  versioning?: IProjectVersioning['id'];
}

export type IProjectTargetDef = IProjectTarget<Record<string, unknown>>;

export interface IProject extends IProjectDef {
  info?: {
    contactEmail?: string;
    contactName?: string;
  }
  resync?: {
    intervalSeconds?: number;
  };

  artifacts: Record<string, IProjectArtifact<Record<string, unknown>>>;
  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlow<Record<string, unknown>>>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTarget<Record<string, unknown>>>;
  versionings: Record<string, Record<string, unknown>>;
}

export type IProjectDefInput = Omit<IProjectDef, 'isSyncing'>;
export type IProjectTargetInput = Omit<IProjectTarget, 'isSyncing'>;
export type IProjectTargetStreamInput = Omit<IProjectTargetStream, 'isSyncing'>;

export interface IProjectInput extends IProjectDef {
  info?: IProject['info'];
  resync?: IProject['resync'];

  artifacts: Record<string, IProjectDefInput & Pick<IProjectArtifact, 'dependsOn'>>;
  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlow>;
  integrations?: Record<string, IProjectDefInput>;
  storages?: Record<string, IProjectDefInput>;
  targets: Record<string, IProjectTargetInput & { streams: Record<string, IProjectTargetStreamInput & { use?: string }> }>;
  versionings: Record<string, IProjectDefInput>;
}

export class Project implements IProject {
  @Autowired() protected projectsService: ProjectsService;

  id: string = 'unknown';

  title: string;
  descriptopn: string;

  env: {
    artifacts: ArtifactsService;
    actions: ActionsService;
    integrations: IntegrationsService;
    storages: StoragesService;
    streams: StreamsService;
    targets: TargetsService;
    versionings: VersioningsService;
  };

  info?: IProject['info'];

  resync?: {
    intervalSeconds?: number;
    at?: Date;
  };

  artifacts: Record<string, IProjectArtifact<Record<string, unknown>>> = {};
  definitions: Record<string, Record<string, unknown>> = {};
  flows: Record<string, IProjectFlowDef> = {};
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTargetDef> = {};
  versionings: Record<string, Record<string, unknown>>;

  get description() {
    return '';
  }

  get assertType() {
    return '*';
  }

  get type() {
    return this.id;
  }

  constructor(config: Partial<IProjectInput & { env?: Project['env'] }>) {
    if (config.id) {
      this.id = config.id;
    }

    this.info = { ...config?.info };
    this.resync = { ...config?.resync, at: null };

    if (config.artifacts) {
      this.artifacts = config.artifacts;
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
                ref: { actionId: actDef.id ?? actKey, flowId: key, projectId: this.id },
                title: actDef.title,
                description: actDef.description,
                artifacts: actDef.artifacts,
                params: actDef.params,
                steps: actDef.steps.map((step) => ({
                  id: step.id ?? actKey,
                  type: step.type,
                  ref: { actionId: actDef.id ?? actKey, flowId: key, projectId: this.id },
                  config: this.getDefinition(step.config),
                  description: step.description,
                  params: actDef.params
                    ? _.mapValues(actDef.params, (param) => {
                      param.validationSchema = this.getFlowActionParamValidationSchema(param);

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
          artifacts: def.artifacts,
          streams: Object
            .entries(def.streams ?? {})
            .reduce((acc, [ actKey, actDef ]) => {
              acc[actKey] = {
                id: actDef.id ?? actKey,
                type: actDef.type,
                ref: { projectId: this.id, streamId: actDef.id ?? actKey, targetId: key },
                config: this.getDefinition(actDef.config),
                title: actDef.title,
                description: actDef.description,
                artifacts: actDef.artifacts,
                tags: actDef.tags ?? [],
                targets: actDef.targets ?? [],
              };

              return acc;
            }, {}),
          versioning: def.versioning,
        };
      }
    }
  }

  getArtifactByArtifactId(artifactId: IProjectArtifact['id']): IProjectArtifact {
    return this.artifacts[artifactId];
  }

  getFlowByFlowId(flowId: IProjectFlow['id']): IProjectFlowDef {
    return this.flows[flowId];
  }

  getStateByTargetId(targetId: IProjectTarget['id']): Promise<ProjectState> {
    return this.projectsService.getState(this.id, { [targetId]: true });
  }

  async getStreamStateByTargetIdAndStreamId(
    targetId: IProjectTarget['id'],
    streamId: IProjectTargetStream['id'],
    scopes?: Record<string, boolean>,
  ): Promise<IStream> {
    return (await this.projectsService.getState(this.id, { [targetId]: [ streamId ] }, scopes))?.targets?.[targetId]?.streams?.[streamId];
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

  getTargetStreamByTargetIdAndStreamId<S extends IProjectTargetStreamDef = IProjectTargetStreamDef>(
    targetId: string,
    streamId: string,
    unsafe?: boolean,
  ): S {
    const stream = this.getTargetByTargetId(targetId).streams[streamId] as S;

    if (!stream) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project stream "${streamId}" not found`);
    }

    return stream;
  }

  getTargetVersioning(targetId: string, unsafe?: boolean): IProjectTargetDef['versioning'] {
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

  getEnvArtifactByArtifactId(artifactId: IProjectArtifact['id'], assertType?: IProjectArtifact['type']) {
    return this.env.artifacts.get(artifactId, assertType, true);
  }

  getEnvActionByFlowActionStep(actionStep: IProjectFlowActionStep) {
    return this.env.actions.get(actionStep.type);
  }

  getEnvIntegraionByIntegrationId<T extends IIntegrationService>(integrationId: IProjectDef['id'], assertType?: IProjectTargetStreamDef['type']): T {
    return this.env.integrations.get(integrationId, assertType) as T;
  }

  getEnvIntegraionByTargetIdAndStreamId<T extends IIntegrationService>(targetId: IProjectTargetDef['id'], streamId: IProjectTargetStreamDef['id'], assertType?: IProjectTargetStreamDef['type']): T {
    return this.getEnvIntegraionByTargetStream(this.getTargetStreamByTargetIdAndStreamId<T>(targetId, streamId), assertType) as T;
  }

  getEnvIntegraionByTargetStream<T extends IIntegrationService>(stream: IProjectTargetStreamDef, assertType?: IProjectTargetStreamDef['type']) {
    return this.env.integrations.get(stream.config?.integration as string, assertType) as T;
  }

  getEnvStorageByStorageId(storageId: IProjectTargetDef['id']) {
    return this.env.storages.get(storageId);
  }

  getEnvStreamByTargetIdAndStreamId<T extends IStreamService>(targetId: IProjectTargetDef['id'], streamId: IProjectTargetStreamDef['id']): T {
    return this.env.streams.get(this.targets[targetId]?.streams[streamId]?.type) as T;
  }

  getEnvStreamByTargetStream<T extends IStreamService>(stream: IProjectTargetStreamDef, assertType?: IProjectTargetStreamDef['type']): T {
    return this.env.streams.get(stream.type, assertType) as T;
  }

  getEnvVersioningByVersioningId(versiningId: IProjectVersioning['id'], assertType?: IProjectVersioning['type']) {
    return this.env.versionings.get(versiningId, assertType);
  }

  getEnvVersioningByTargetId(targetId: IProjectTargetDef['id'], assertType?: IProjectVersioning['type']) {
    return this.getEnvVersioningByTarget(this.getTargetByTargetId(targetId), assertType);
  }

  getEnvVersioningByTarget(target: IProjectTargetDef, assertType?: IProjectVersioning['type']) {
    return this.env.versionings.get(target.versioning, assertType);
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
    const action = this.getFlowByFlowId(flowId)?.actions?.[actionId];

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

  private getFlowActionParamValidationSchema(action: IProjectFlowActionParam) {
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
