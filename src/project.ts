import { StepsService } from './steps.service';
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
import { StreamState } from './stream';
import { ProjectState } from './project-state';
import {ValidatorService} from './validator.service';

export interface IProjectDef<C extends Record<string, any> | string = Record<string, any>, T extends string = string> {
  id?: string;
  type: T;

  title?: string;
  description?: string;

  isSyncing?: boolean;
  ref?: IProjectRef;

  config?: C & Record<string, unknown>;
}

export interface IProjectRef {
  actionId?: IProjectFlowActionDef['id'],
  flowId?: IProjectFlowDef['id'],
  projectId?: IProjectDef['id'],
  streamId?: IProjectTargetStreamDef['id'],
  targetId?: IProjectTargetDef['id'],
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

export interface IProjectFlowActionStep<C extends Record<string, unknown>, T extends string = string> extends IProjectDef<C, T> {
  isDirty?: boolean;

  params?: Record<string, IProjectFlowActionParam>;
  targets?: IProjectTargetDef['id'][];
}

export type IProjectFlowActionStepDef = IProjectFlowActionStep<Record<string, unknown>>;

export interface IProjectFlowAction<C extends Record<string, unknown>, T extends string = string> extends IProjectDef<unknown, T> {
  isDirty?: boolean;

  streams?: IProjectTargetStreamDef['id'][];
  steps?: IProjectFlowActionStep<C>[];
  params?: Record<string, IProjectFlowActionParam>;
  targets?: IProjectTargetDef['id'][];
}

export type IProjectFlowActionDef = IProjectFlowAction<Record<string, unknown>>;

export interface IProjectFlow<C extends Record<string, unknown>> extends IProjectDef {
  isDirty?: boolean;

  actions: Record<string, IProjectFlowAction<C>>;
  targets: IProjectTargetDef['id'][];
}

export type IProjectFlowDef = IProjectFlow<Record<string, unknown>>;

export interface IProjectTargetStream<C extends Record<string, unknown>, T extends string = string> extends IProjectDef<C, T> {
  isDirty?: boolean;

  artifacts?: IProjectArtifact['id'][];
  actions?: Record<string, IProjectFlowActionDef>;
  tags?: string[];
  targets?: IProjectTargetDef['id'][];
}

export type IProjectTargetStreamDef = IProjectTargetStream<Record<string, unknown>>;

export interface IProjectTarget<C extends Record<string, unknown>> extends IProjectDef {
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
  flows: Record<string, IProjectFlowDef>;
  integrations?: Record<string, IProjectDef>;
  storages?: Record<string, IProjectDef>;
  targets: Record<string, IProjectTargetDef>;
  versionings: Record<string, Record<string, unknown>>;
}

export type IProjectDefInput = Omit<IProjectDef, 'isSyncing'>;
export type IProjectTargetInput = Omit<IProjectTargetDef, 'isSyncing'>;
export type IProjectTargetStreamInput = Omit<IProjectTargetStreamDef, 'isSyncing'>;

export interface IProjectManifest extends IProjectDef {
  info?: IProject['info'];
  resync?: IProject['resync'];

  artifacts: Record<string, IProjectDefInput & Pick<IProjectArtifact, 'dependsOn'>>;
  definitions: Record<string, Record<string, unknown>>;
  flows: Record<string, IProjectFlowDef>;
  integrations?: Record<string, IProjectDefInput>;
  storages?: Record<string, IProjectDefInput>;
  targets: Record<string, IProjectTargetInput & { streams: Record<string, IProjectTargetStreamInput & { use?: string }> }>;
  versionings: Record<string, IProjectDefInput>;
}

export class Project implements IProject {
  @Autowired() protected projectsService: ProjectsService;

  id: string = 'unknown';

  title: string;
  description: string;

  env: {
    artifacts: ArtifactsService;
    steps: StepsService;
    integrations: IntegrationsService;
    storages: StoragesService;
    streams: StreamsService;
    targets: TargetsService;
    validator: ValidatorService;
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

  get assertType() {
    return '*';
  }

  get type() {
    return this.id;
  }

  constructor(config: Partial<IProjectManifest & { env?: Project['env'] }>) {
    if (config.id) {
      this.id = config.id;
    }

    this.title = config?.title;
    this.description = config?.description;

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
        const flowId = def.id ?? key;
        this.assertKey(flowId);

        this.flows[flowId] = {
          id: flowId,
          type: 'flow',

          ref: { flowId, projectId: this.id },

          title: def.title,
          description: def.description,

          targets: def.targets ?? [],
          actions: Object
            .entries(def.actions ?? {})
            .reduce((acc, [ actionKey, actionDef ]) => {
              const actionId = actionDef.id ?? actionKey;
              this.assertKey(actionId);

              if (actionDef.params) {
                this.env.validator.addSchemaFromDef(actionDef.params, actionId);
              }

              acc[actionId] = {
                id: actionId,
                type: actionDef.type,

                ref: { actionId, flowId, projectId: this.id },

                title: actionDef.title,
                description: actionDef.description,

                params: actionDef.params,
                streams: actionDef.streams,
                steps: actionDef.steps.map((step, i) => ({
                  id: step.id ?? i,
                  type: step.type,
                  ref: { actionId, flowId, projectId: this.id },
                  config: this.getDefinition(step.config),
                  description: step.description,
                  params: actionDef.params,
                  targets: step.targets ?? actionDef.targets ?? [],
                })),
              };

              return acc;
            }, {}),
        };
      }
    }

    if (config.targets) {
      for (const [ key, def ] of Object.entries(config.targets)) {
        const targetId = def.id ?? key;
        this.assertKey(targetId);

        this.targets[targetId] = {
          id: targetId,
          type: 'target',

          ref: { projectId: this.id },

          title: def.title,
          description: def.description,

          artifacts: def.artifacts,
          streams: Object
            .entries(def.streams ?? {})
            .reduce((acc, [ streamKey, streamDef ]) => {
              const streamId = streamDef.id ?? streamKey;
              this.assertKey(streamId);

              acc[streamId] = {
                id: streamId,
                type: streamDef.type,

                ref: { projectId: this.id, streamId, targetId },

                title: streamDef.title,
                description: streamDef.description,

                config: this.getDefinition(streamDef.config),
                artifacts: streamDef.artifacts,
                tags: streamDef.tags ?? [],
                targets: streamDef.targets ?? [],
              };

              if (streamDef.actions) {
                Object.entries(streamDef.actions).forEach((action, i) => {
                  const flowId = `${Date.now()}:${i}:${targetId}:${streamId}`;

                  this.flows[flowId] = {
                    id: flowId,
                    type: 'flow',

                    ref: { flowId, projectId: this.id, streamId, targetId },

                    title: null,
                    description: null,

                    targets: [ def.id ?? key ],
                    actions: Object
                      .entries(streamDef.actions ?? {})
                      .reduce((acc, [ actionKey, actionDef ]) => {
                        const actionId = actionDef.id ?? actionKey;
                        this.assertKey(actionId);

                        if (actionDef.params) {
                          this.env.validator.addSchemaFromDef(actionDef.params, actionId);
                        }

                        acc[actionId] = {
                          id: actionId,
                          type: actionDef.type,

                          ref: { actionId, flowId, projectId: this.id, streamId, targetId },

                          title: actionDef.title,
                          description: actionDef.description,

                          params: actionDef.params,
                          streams: actionDef.streams,
                          steps: actionDef.steps.map((step, i) => ({
                            id: step.id ?? i,
                            type: step.type,
                            ref: { actionId, flowId, projectId: this.id, streamId, targetId },
                            config: this.getDefinition(step.config),
                            description: step.description,
                            params: actionDef.params,
                            targets: step.targets ?? actionDef.targets ?? [],
                          })),
                        };
          
                        return acc;
                      }, {}),
                  };
                });
              }

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

  getFlowByFlowId(flowId: IProjectFlowDef['id']): IProjectFlowDef {
    return this.flows[flowId];
  }

  getStateByTargetId(targetId: IProjectTargetDef['id']): Promise<ProjectState> {
    return this.projectsService.getState(this.id, { [targetId]: true });
  }

  async getStreamStateByTargetIdAndStreamId(
    targetId: IProjectTargetDef['id'],
    streamId: IProjectTargetStreamDef['id'],
    scopes?: Record<string, boolean>,
  ): Promise<StreamState> {
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

  getEnvActionByFlowActionStep(actionStep: IProjectFlowActionStepDef) {
    return this.env.steps.get(actionStep.type);
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

  assertKey(key: string) {
    if (key.includes(':')) {
      throw new Error(`Key "${key}" contains reserved character ":"`);
    }
  }

  toJSON() {
    return {
      id: this.id,

      title: this.title ?? null,
      description: this.description ?? null,

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
