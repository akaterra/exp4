import { IProjectInput, Project } from './project';
import Container from 'typedi';
import { IntegrationsService } from './integrations.service';
import { StoragesService } from './storages.service';
import { StreamsService } from './streams.service';
import { ActionsService } from './actions.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';
import { loadDefinitionFromFile, loadDefinitionsFromDirectory } from './utils';

export function loadProjectsFromDirectory(path: string, ids?: string[]): Project[] {
  const definitions: (IProjectInput & { env?: Project['env'] })[] = loadDefinitionsFromDirectory(path);

  return definitions
    .filter((project) => !!project && (!ids?.length || ids.includes(project.id)))
    .map((definition) => createProjectFromDefinition(definition, true));
}

export function loadProjectFromFile(pathOrName: string): Project {
  const definition: IProjectInput & { env?: Project['env'] } = loadDefinitionFromFile(pathOrName);

  return definition
    ? createProjectFromDefinition(definition)
    : null;
}

export function createProjectFromDefinition(definition: IProjectInput & { env?: Project['env'] }, notThrow?: boolean): Project {
  if (definition.type !== 'project') {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid project definition');
  }

  definition.env = {
    actions: Container.get(ActionsService),
    integrations: Container.get(IntegrationsService),
    storages: Container.get(StoragesService),
    streams: Container.get(StreamsService),
    targets: Container.get(TargetsService),
    versionings: Container.get(VersioningsService),
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
    const actionsService = definition.env.actions;

    for (const [ ,flow ] of Object.entries(definition.flows)) {
      for (const [ , defConfig ] of Object.entries(flow.actions)) {
        defConfig.steps.forEach((c) => actionsService.get(c.type));
      }
    }
  }

  if (definition.targets) {
    const streamsService = Container.get(StreamsService);

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

        streamsService.add(streamsService.getInstance(defConfig.type, defConfig.config), defConfig.type);
      }

      definition.env.versionings.get(target.versioning);
    }
  }

  return new Project(definition);
}
