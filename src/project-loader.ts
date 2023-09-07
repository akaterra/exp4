import { IProjectInput, Project } from './project';
import { IntegrationsService } from './integrations.service';
import { StoragesService } from './storages.service';
import { StreamsService } from './streams.service';
import { ActionsService } from './actions.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';
import { loadDefinitionFromFile, loadDefinitionsFromDirectory, loadModules } from './utils';
import { ArtifactsService } from './artifacts.service';

export function loadProjectsFromDirectory(path: string, ids?: string[]): Promise<Project[]> {
  const definitions: (IProjectInput & { env?: Project['env'] })[] = loadDefinitionsFromDirectory(path);

  return Promise.all(definitions.filter((project) => !!project && (!ids?.length || ids.includes(project?.id)))
    .map((definition) => createProjectFromDefinition(definition, true))
  ).then((projects) => projects.filter((project) => !!project));
}

export function loadProjectFromFile(pathOrName: string): Promise<Project> {
  const definition: IProjectInput & { env?: Project['env'] } = loadDefinitionFromFile(pathOrName);

  return definition
    ? createProjectFromDefinition(definition)
    : null;
}

export async function createProjectFromDefinition(definition: IProjectInput & { env?: Project['env'] }, notThrow?: boolean): Promise<Project> {
  if (definition?.type !== 'project') {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid project definition');
  }

  definition.env = {
    artifacts: new ArtifactsService(),
    actions: new ActionsService(),
    integrations: new IntegrationsService(),
    storages: new StoragesService(),
    streams: new StreamsService(),
    targets: new TargetsService(),
    versionings: new VersioningsService(),
  }

  for (const artifact of await loadModules(__dirname + '/artifacts', 'ArtifactService')) {
    definition.env.artifacts.addFactory(artifact);
  }

  for (const action of await loadModules(__dirname + '/actions', 'ActionService')) {
    definition.env.actions.add(new action());
  }

  for (const integration of await loadModules(__dirname + '/integrations', 'IntegrationService')) {
    definition.env.integrations.addFactory(integration);
  }

  for (const storage of await loadModules(__dirname + '/storages', 'StorageService')) {
    definition.env.storages.addFactory(storage);
  }

  for (const stream of await loadModules(__dirname + '/streams', 'StreamService')) {
    definition.env.streams.addFactory(stream);
  }

  for (const versioning of await loadModules(__dirname + '/versionings', 'VersioningService')) {
    definition.env.versionings.addFactory(versioning);
  }

  if (definition.artifacts) {
    const artifactsService = definition.env.artifacts;

    for (const [ defId, defConfig ] of Object.entries(definition.artifacts)) {
      artifactsService.add(artifactsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (definition.integrations) {
    const integrationsService = definition.env.integrations;

    for (const [ defId, defConfig ] of Object.entries(definition.integrations)) {
      integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (definition.storages) {
    const storagesService = definition.env.storages;

    for (const [ defId, defConfig ] of Object.entries(definition.storages)) {
      storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (definition.versionings) {
    const versioningsService = definition.env.versionings;

    for (const [ defId, defConfig ] of Object.entries(definition.versionings).concat([ [ null, { type: null } ] ])) {
      versioningsService.add(versioningsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (definition.flows) {
    const artifactsService = definition.env.artifacts;
    const actionsService = definition.env.actions;

    for (const [ ,flow ] of Object.entries(definition.flows)) {
      for (const [ , defConfig ] of Object.entries(flow.actions)) {
        defConfig.artifacts?.forEach((artifactId) => artifactsService.get(artifactId));
        defConfig.steps?.forEach((actionType) => actionsService.get(actionType.type));
      }
    }
  }

  if (definition.targets) {
    const artifactsService = definition.env.artifacts;
    const streamsService = definition.env.streams;

    for (const [ ,target ] of Object.entries(definition.targets)) {
      for (const [ defId, defConfig ] of Object.entries(target.streams)) {
        const use = defConfig.use ? definition.targets[defConfig.use]?.streams?.[defId] : null;

        if (use) {
          for (const [ key, val ] of Object.entries(use)) {
            if (defConfig[key] === undefined) {
              defConfig[key] = val;
            }
          }

          delete defConfig.use;
        }

        defConfig.artifacts?.forEach((artifactId) => artifactsService.get(artifactId));
        streamsService.add(streamsService.getInstance(defConfig.type, defConfig.config), defConfig.type);
      }

      target.artifacts?.forEach((artifactId) => artifactsService.get(artifactId));
      definition.env.versionings.get(target.versioning);
    }
  }

  return new Project(definition);
}
