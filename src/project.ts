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
import { Autowired, iter } from './utils';
import { IStreamStateContext } from './stream-state';
import { ProjectState } from './project-state';
import { ValidatorService } from './services/validator.service';
import { TargetState } from './target-state';
import { StatisticsService } from './statistics.service';
import { logger } from './logger';
import { INotificationService, NotificationHolderService } from './notifications';

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
  tags?: string[];
  targets?: IProjectTargetDef['id'][];
}

export type IProjectTargetStreamDef = IProjectTargetStream<Record<string, unknown>>;

export interface IProjectTarget<C extends Record<string, unknown>> extends IProjectDef {
  isDirty?: boolean;

  artifacts?: IProjectArtifact['id'][];
  streams: Record<string, IProjectTargetStream<C>>;
  events?: Record<string, IProjectDef[]>;
  release?: {
    sections: {
      id?: string;
      type?: string;

      changelog?: {
        artifacts?: IProjectArtifact['id'][];
      };
      flows?: IProjectFlowDef['id'][];
    }[];
  };
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
  events: Record<string, IProjectDefInput[]>;
  flows: Record<string, IProjectFlowDef>;
  integrations?: Record<string, IProjectDefInput>;
  notifications?: Record<string, IProjectDefInput>;
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
  events: Record<string, IProjectDef[]> = {};
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

    if (config.events) {
      this.events = config.events;
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
          events: targetDef.events,
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
          release: targetDef.release,
          versioning: targetDef.versioning,
        };
      }
    }
  }

  getArtifactByArtifact(mixed: IProjectArtifact['id'] | IProjectArtifact): IProjectArtifact {
    return this.artifacts[typeof mixed === 'string' ? mixed : mixed.id];
  }

  getFlowByFlow(mixed: IProjectFlowDef['id'] | IProjectFlowDef): IProjectFlowDef {
    return this.flows[typeof mixed === 'string' ? mixed : mixed.id];
  }

  getTargetByTarget<S extends IProjectTargetDef = IProjectTargetDef>(mixed: IProjectTargetDef['id'] | IProjectTargetDef | TargetState, unsafe?: boolean): S {
    const id = typeof mixed === 'string' ? mixed : mixed.id;
    const target = this.targets[id] as S;

    if (!target) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project target "${id}" not found`);
    }

    return target;
  }

  getTargetByTargetStream(mixed: IProjectTargetStreamDef['id'] | IProjectTargetStreamDef) {
    return this.getTargetByTarget(typeof mixed === 'string' ? mixed : mixed.ref.targetId);
  }

  getTargetStreamByTargetAndStream<S extends IProjectTargetStreamDef = IProjectTargetStreamDef>(
    targetMixed: IProjectTargetDef['id'] | IProjectTargetDef,
    streamMixed: IProjectTargetStreamDef['id'] | IProjectTargetStreamDef,
    unsafe?: boolean,
  ): S {
    const id = typeof streamMixed === 'string' ? streamMixed : streamMixed.id;
    const stream = this.getTargetByTarget(targetMixed).streams[id] as S;

    if (!stream) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project stream "${id}" not found`);
    }

    return stream;
  }

  getTargetVersioning(mixed: IProjectTargetDef['id'] | IProjectTargetDef, unsafe?: boolean): IProjectTargetDef['versioning'] {
    const id = typeof mixed === 'string' ? mixed : mixed.id;
    const versioning = this.getTargetByTarget(id).versioning;

    if (versioning === undefined) {
      if (unsafe) {
        return null;
      }

      throw new Error(`Project target "${id}" versioning not found`);
    }

    return versioning;
  }

  // helpers

  getEnvArtifactByArtifact(mixed: IProjectArtifact['id'] | IProjectArtifact, assertType?: IProjectArtifact['type']) {
    return this.env.artifacts.get(typeof mixed === 'string' ? mixed : mixed.id, assertType, true);
  }

  getEnvActionByFlowActionStep(actionStep: IProjectActionDef) {
    return this.env.actions.get(actionStep.type);
  }

  getEnvIntegraionByIntegration<T extends IIntegrationService>(mixed: IProjectDef['id'] | IProjectDef, assertType?: IProjectTargetStreamDef['type']): T {
    return this.env.integrations.get(typeof mixed === 'string' ? mixed : mixed.id, assertType) as T;
  }

  getEnvIntegraionByTargetAndStream<T extends IIntegrationService>(mixedTarget: IProjectTargetDef['id'] | IProjectTargetDef, mixedStream: IProjectTargetStreamDef['id'] | IProjectTargetStreamDef, assertType?: IProjectTargetStreamDef['type']): T {
    return this.getEnvIntegraionByTargetStream(this.getTargetStreamByTargetAndStream<T>(mixedTarget, mixedStream), assertType) as T;
  }

  getEnvIntegraionByTargetStream<T extends IIntegrationService>(stream: IProjectTargetStreamDef, assertType?: IProjectTargetStreamDef['type']) {
    return this.env.integrations.get(stream.config?.integration as string, assertType) as T;
  }

  getEnvNotificationByNotification<T extends INotificationService>(mixed: IProjectDef['id'] | IProjectDef, assertType?: IProjectTargetStreamDef['type']): T {
    return this.env.notifications.get(typeof mixed === 'string' ? mixed : mixed.id, assertType) as T;
  }

  getEnvStorageByStorageId(mixed: IProjectTargetDef['id'] | IProjectTargetDef) {
    return this.env.storages.get(typeof mixed === 'string' ? mixed : mixed.id);
  }

  getEnvStreamByTargetAndStream<T extends IStreamService>(mixedTarget: IProjectTargetDef['id'] | IProjectTargetDef, mixedStream: IProjectTargetStreamDef['id'] | IProjectTargetStreamDef): T {
    return this.env.streams.get(this.targets[typeof mixedTarget === 'string' ? mixedTarget : mixedTarget.id]?.streams[typeof mixedStream === 'string' ? mixedStream : mixedStream.id]?.type) as T;
  }

  getEnvStreamByTargetStream<T extends IStreamService>(stream: IProjectTargetStreamDef, assertType?: IProjectTargetStreamDef['type']): T {
    return this.env.streams.get(this.getTargetStreamByTargetAndStream(stream.ref?.targetId, stream.id).type, assertType) as T;
  }

  getEnvVersioningByVersioning(mixed: IProjectVersioning['id'] | IProjectVersioning, assertType?: IProjectVersioning['type']) {
    return this.env.versionings.get(typeof mixed === 'string' ? mixed : mixed.id, assertType);
  }

  getEnvVersioningByTarget(target: IProjectTargetDef['id'] | IProjectTargetDef | TargetState, assertType?: IProjectVersioning['type']) {
    return this.env.versionings.get(this.getTargetByTarget(target).versioning, assertType);
  }

  getEnvVersioningByTargetStream(stream: IProjectTargetStreamDef['id'] | IProjectTargetStreamDef, assertType?: IProjectVersioning['type']) {
    return this.env.versionings.get(this.getTargetByTargetStream(stream).versioning, assertType);
  }

  assertKey(key: string) {
    if (key.includes(':')) {
      throw new Error(`Key "${key}" contains reserved character ":"`);
    }
  }

  async flowRun(
    flowId: string | string[],
    targetsStreams?: Record<IProjectTargetDef['id'], [ string, ...string[] ] | true> | IProjectTargetDef['id'][],
    params?: Record<string, any>,
  ) {
    if (Array.isArray(targetsStreams)) {
      targetsStreams = targetsStreams.reduce((acc, tId) => {
        acc[tId] = true;

        return acc;
      }, {});
    }

    for (const [ , fId ] of iter(flowId)) {
      const flow = this.getFlowByFlow(fId);

      if (!flow) {
        continue;
      }

      this.env.validator.validate(params, fId);

      for (const action of flow.actions) {
        logger.info({
          message: 'flowStepRun',
          ref: action.ref,
          params,
          targetsStreams,
        });

        try {
          await this.env.actions.get(action.type).run(flow, action, targetsStreams, params);
        } catch (err) {
          this.statisticsService.add(`projects.${this.id}.errors`, {
            message: err?.message ?? err ?? null,
            time: new Date(),
            type: 'projectFlow:run',
          });

          if (
            !action.bypassErrorCodes ||
            (
              !action.bypassErrorCodes.includes(err?.cause) &&
              !action.bypassErrorCodes.includes('*')
            )
          ) {
            throw err;
          }
        }
      }
    }

    return true;
  }

  async raiseEvent(eventId: string, params?: Record<string, any>) {
    const targets = Object.keys(this.targets);
    const events = this.events?.[eventId];

    if (!events) {
      logger.warn(`Project "${this.id}" event "${eventId}" not found`);

      return;
    }

    for (const event of events) {
      switch (event.type) {
        default:
          await this.flowRun(
            event.config?.flowId,
            targets,
            params,
          );

          break;
      }
    }
  }

  async raiseTargetEvent(mixed: IProjectTargetDef['id'] | IProjectTargetDef, eventId: string, params?: Record<string, any>) {
    const target = this.getTargetByTarget(mixed);
    const events = target.events?.[eventId];

    if (!events) {
      logger.warn(`Project "${this.id}" target "${target.id}" event "${eventId}" not found`);

      return;
    }

    for (const event of events) {
      switch (event.type) {
        default:
          await this.flowRun(
            event.config?.flowId,
            [ target.id ],
            params,
          );

          break;
      }
    }
  }

  async rereadTargetStateByTarget(mixed: IProjectTargetDef['id'] | IProjectTargetDef | TargetState): Promise<TargetState> {
    const target = this.getTargetByTarget(mixed);
    const targetState = await this.env.targets.getState(target);
    this.state.setTargetState(target.id, targetState);

    return targetState;
  }

  async rereadcStreamStateByTargetAndStream(
    targetMixed: IProjectTargetDef['id'] | IProjectTargetDef,
    streamMixed: IProjectTargetStreamDef['id'] | IProjectTargetStreamDef,
    scopes?: Record<string, boolean>,
    context?: IStreamStateContext,
  ) {
    const stream = this.getTargetStreamByTargetAndStream(targetMixed, streamMixed);
    const streamState = await this.env.streams.getState(stream, scopes, context);
    this.state.setTargetStreamState(stream.ref.targetId, streamState);

    return streamState;
  }

  async updateTargetState(mixed: IProjectTargetDef['id'] | IProjectTargetDef | TargetState) {
    let targetState = this.state.getTargetState(mixed, true);

    if (!targetState) {
      return;
    }

    await this.projectsService.updateTargetState(targetState);
    await this.raiseTargetEvent(targetState.id, 'targetUpdated');  
  }

  toJSON() {
    return {
      id: this.id,

      title: this.title ?? null,
      description: this.description ?? null,

      definitions: this.definitions,
      events: this.events,
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
