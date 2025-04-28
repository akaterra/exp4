import { ActionHolderService } from './actions';
import { IntegrationHolderService } from './integrations';
import { IIntegrationService } from './integrations';
import { StorageHolderService } from './storages';
import { StreamHolderService } from './streams';
import { IStreamService } from './streams';
import { TargetHolderService } from './targets';
import { VersioningHolderService } from './versionings';
import { ArtifactHolderService } from './artifacts';
import { ProjectsService } from './projects.service';
import { Autowired, AwaitableContainer, iter } from './utils';
import { IStreamStateContext, StreamState } from './stream-state';
import { ProjectState } from './project-state';
import { ValidatorService } from './services/validator.service';
import { TargetState } from './target-state';
import { StatisticsService} from './statistics.service';
import { logger } from './logger';
import {NotificationHolderService} from './notifications';

export interface IProjectDef<C extends Record<string, any> | string = Record<string, any>, T extends string = string> {
  id?: string;
  type: T;

  title?: string;
  description?: string;

  isSyncing?: boolean;
  ref?: IProjectRef;

  config?: C & Record<string, any>;
}

export interface IProjectRef {
  // actionId?: IProjectFlowActionDef['id'],
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

export interface IProjectAction<C extends Record<string, unknown>, T extends string = string> extends IProjectDef<C, T> {
  isDirty?: boolean;

  params?: Record<string, IProjectFlowActionParam>;
  bypassErrorCodes?: string[];
  targets?: IProjectTargetDef['id'][];
}

export type IProjectActionDef = IProjectAction<Record<string, unknown>>;

export interface IProjectFlow<C extends Record<string, unknown>> extends IProjectDef {
  isDirty?: boolean;

  params?: Record<string, IProjectFlowActionParam>;
  actions: IProjectAction<C>[];
  targets: IProjectTargetDef['id'][];
}

export type IProjectFlowDef = IProjectFlow<Record<string, unknown>>;

export interface IProjectTargetStream<C extends Record<string, unknown>, T extends string = string> extends IProjectDef<C, T> {
  isDirty?: boolean;

  artifacts?: IProjectArtifact['id'][];
  // actions?: Record<string, IProjectFlowActionDef>;
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
  @Autowired() protected statisticsService: StatisticsService;

  id: string = 'unknown';

  title: string;
  description: string;

  env: {
    actions?: ActionHolderService;
    artifacts?: ArtifactHolderService;
    integrations?: IntegrationHolderService;
    notifications?: NotificationHolderService;
    storages?: StorageHolderService;
    streams?: StreamHolderService;
    targets?: TargetHolderService;
    validator?: ValidatorService;
    versionings?: VersioningHolderService;
  };

  info?: IProject['info'];

  resync?: {
    intervalSeconds?: number;
    at?: Date;
  };

  state: ProjectState = null;

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
      for (const [ flowKey, flowDef ] of Object.entries(config.flows)) {
        const flowId = flowDef.id ?? flowKey;
        this.assertKey(flowId);

        this.flows[flowId] = {
          id: flowId,
          type: 'flow',

          ref: { flowId, projectId: this.id },

          title: flowDef.title,
          description: flowDef.description,

          params: flowDef.params,
          actions: flowDef.actions.map((stepDef, i) => {
            const stepId = stepDef.id ?? String(i);
            this.assertKey(stepId);

            return {
              id: stepId,
              type: stepDef.type,
  
              ref: { flowId, projectId: this.id, stepId },
  
              title: stepDef.title,
              description: stepDef.description,
  
              config: this.getDefinition(stepDef.config),
              bypassErrorCodes: stepDef.bypassErrorCodes,
              params: stepDef.params,
              targets: stepDef.targets ?? [],
            };
          }),
          targets: flowDef.targets ?? [],
        };
      }
    }

    if (config.targets) {
      for (const [ targetKey, targetDef ] of Object.entries(config.targets)) {
        const targetId = targetDef.id ?? targetKey;
        this.assertKey(targetId);

        this.targets[targetId] = {
          id: targetId,
          type: 'target',

          ref: { projectId: this.id },

          title: targetDef.title,
          description: targetDef.description,

          artifacts: targetDef.artifacts,
          streams: Object
            .entries(targetDef.streams ?? {})
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

                ver: 0,
              };

              return acc;
            }, {}),
          versioning: targetDef.versioning,
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

  async getTargetStateByTargetId(targetId: IProjectTargetDef['id']): Promise<TargetState> {
    const targetState = await this.env.targets.getState(this.getTargetByTargetId(targetId));

    return targetState;
  }

  async getStreamStateByTargetIdAndStreamId(
    targetId: IProjectTargetDef['id'],
    streamId: IProjectTargetStreamDef['id'],
    scopes?: Record<string, boolean>,
    context?: IStreamStateContext,
  ) {
    const streamState = await this.env.streams.getState(
      this.getTargetStreamByTargetIdAndStreamId(targetId as IProjectTargetDef['id'], streamId as IProjectTargetStreamDef['id']),
      scopes,
      context,
    );

    return streamState;
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
    targetId: IProjectTargetDef['id'],
    streamId: IProjectTargetStreamDef['id'],
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

  getEnvActionByFlowActionStep(actionStep: IProjectActionDef) {
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

  getEnvVersioningByTargetStream(stream: IProjectTargetStreamDef, assertType?: IProjectVersioning['type']) {
    return this.env.versionings.get(this.getTargetByTargetStream(stream).versioning, assertType);
  }

  assertKey(key: string) {
    if (key.includes(':')) {
      throw new Error(`Key "${key}" contains reserved character ":"`);
    }
  }

  async flowRun(
    flowId: string | string[],
    targetsStreams?: Record<string, [ string, ...string[] ] | true>,
    params?: Record<string, any>,
  ) {
    for (const [ , fId ] of iter(flowId)) {
      const flow = this.getFlowByFlowId(fId);

      if (!flow) {
        continue;
      }

      this.env.validator.validate(params, fId);

      for (const step of flow.actions) {
        logger.info({
          message: 'flowStepRun',
          ref: step.ref,
          params,
          targetsStreams,
        });

        try {
          await this.env.actions.get(step.type).run(flow, step, targetsStreams, params);
        } catch (err) {
          this.statisticsService.add(`projects.${this.id}.errors`, {
            message: err?.message ?? err ?? null,
            time: new Date(),
            type: 'projectFlow:run',
          });

          if (
            !step.bypassErrorCodes ||
            (
              !step.bypassErrorCodes.includes(err?.cause) &&
              !step.bypassErrorCodes.includes('*')
            )
          ) {
            throw err;
          }
        }
      }
    }

    return true;
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
