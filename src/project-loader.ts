import { IProjectInput, Project } from './project';
import YAML from 'yaml'
import fs from 'fs';
import Container from 'typedi';
import { IntegrationsService } from './integrations.service';
import { StoragesService } from './storages.service';
import { StreamsService } from './streams.service';
import { ActionsService } from './actions.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';

const EXTENSIONS = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
};

export function loadFromFile(pathOrName: string): Project {
  let config: IProjectInput & { env?: Project['env'] };

  if (Object.keys(EXTENSIONS).some((ext) => pathOrName.slice(-ext.length - 1) === `.${ext}`)) {
    const fileContent = fs.readFileSync(pathOrName, 'utf8');

    switch (pathOrName.slice(pathOrName.lastIndexOf('.') + 1)) {
      case 'json':
        config = JSON.parse(fileContent);
        break;
      case 'yaml':
        config = YAML.parse(fileContent);
        break;
      case 'yml':
        config = YAML.parse(fileContent);
        break;  
    }

    if (config && typeof config === 'object') {
      if (!config.name) {
        config.name = pathOrName.slice(pathOrName.lastIndexOf('/') + 1, pathOrName.lastIndexOf('.'));
      }
    }
  } else {
    for (const ext of Object.keys(EXTENSIONS)) {
      const filename = `${process.cwd()}/projects/${pathOrName}.${ext}`;

      if (fs.existsSync(filename)) {
        return loadFromFile(filename);
      }
    }
  }

  if (config) {
    config.env = {
      actions: Container.get(ActionsService),
      integrations: Container.get(IntegrationsService),
      storages: Container.get(StoragesService),
      streams: Container.get(StreamsService),
      targets: Container.get(TargetsService),
      versionings: Container.get(VersioningsService),
    }

    if (config.integrations) {
      const integrationsService = config.env.integrations;

      for (const [ defId, defConfig ] of Object.entries(config.integrations)) {
        integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
      }
    }

    if (config.storages) {
      const storagesService = config.env.storages;

      for (const [ defId, defConfig ] of Object.entries(config.storages)) {
        storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
      }
    }

    if (config.versionings) {
      const versioningsService = config.env.versionings;

      for (const [ defId, defConfig ] of Object.entries(config.versionings).concat([ [ null, { type: null } ] ])) {
        versioningsService.add(versioningsService.getInstance(defConfig.type, defConfig.config), defId);
      }
    }

    if (config.flows) {
      const actionsService = config.env.actions;

      for (const [ ,flow ] of Object.entries(config.flows)) {
        for ( const [ defId, defConfig ] of Object.entries(flow.actions)) {
          defConfig.steps.forEach((c) => actionsService.get(c.type));
        }
      }
    }

    if (config.targets) {
      const streamsService = Container.get(StreamsService);

      for (const [ ,target ] of Object.entries(config.targets)) {
        for ( const [ defId, defConfig ] of Object.entries(target.streams)) {
          streamsService.add(streamsService.getInstance(defConfig.type, defConfig.config), defConfig.type);
        }

        config.env.versionings.get(target.versioning);
      }
    }

    return new Project(config);
  }
}
