import Container from 'typedi';
import { IntegrationsService } from './integrations.service';
import { IGlobalConfig } from './global-config';
import { AuthStrategiesService } from './auth-strategies.service';
import { StoragesService } from './storages.service';
import { loadDefinitionFromFile } from './utils';

export function loadGlobalConfigFromFile(pathOrName: string): void {
  const definition: IGlobalConfig = loadDefinitionFromFile(pathOrName);

  return definition
    ? createGlobalConfig(definition)
    : null;
}

export function createGlobalConfig(definition: IGlobalConfig, notThrow?: boolean): void {
  if (definition?.type !== 'global') {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid global config definition');
  }

  if (definition.auth) {
    const authStrategiesService = Container.get(AuthStrategiesService);

    for (const [ , defConfig ] of Object.entries(definition.auth)) {
      authStrategiesService.add(authStrategiesService.getInstance(defConfig.type, defConfig.config), defConfig.type);
    }
  }

  if (definition.integrations) {
    const integrationsService = Container.get(IntegrationsService);

    for (const [ defId, defConfig ] of Object.entries(definition.integrations)) {
      integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (definition.storages) {
    const storagesService = Container.get(StoragesService);

    for (const [ defId, defConfig ] of Object.entries(definition.storages)) {
      storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }
}
