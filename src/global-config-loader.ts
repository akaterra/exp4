import { IProjectInput, Project } from './project';
import YAML from 'yaml'
import fs from 'fs';
import Container from 'typedi';
import { IntegrationsService } from './integrations.service';
import { IGlobalConfig } from './global-config';
import { AuthStrategiesService } from './auth-strategies.service';
import { StoragesService } from './storages.service';

const EXTENSIONS = {
  json: 'json',
  yaml: 'yaml',
  yml: 'yaml',
};

export function loadGlobalConfigFromFile(pathOrName: string): Project {
  let config: IGlobalConfig;

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
  } else {
    for (const ext of Object.keys(EXTENSIONS)) {
      const filename = `${process.cwd()}/projects/${pathOrName}.${ext}`;

      if (fs.existsSync(filename)) {
        return loadGlobalConfigFromFile(filename);
      }
    }
  }

  if (config) {
    if (config.type !== 'global') {
      throw new Error('Invalid global config definition');
    }

    if (config.auth) {
      const authStrategiesService = Container.get(AuthStrategiesService);

      for (const [ defId, defConfig ] of Object.entries(config.auth)) {
        authStrategiesService.add(authStrategiesService.getInstance(defConfig.type, defConfig.config), defConfig.type);
      }
    }

    if (config.integrations) {
      const integrationsService = Container.get(IntegrationsService);

      for (const [ defId, defConfig ] of Object.entries(config.integrations)) {
        integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
      }
    }

    if (config.storages) {
      const storagesService = Container.get(StoragesService);

      for (const [ defId, defConfig ] of Object.entries(config.storages)) {
        storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
      }
    }
  }
}
