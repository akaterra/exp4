import Container from 'typedi';
import { IntegrationsService } from './integrations.service';
import { IGlobalConfig } from './global-config';
import { AuthStrategiesService } from './auth-strategies.service';
import { StoragesService } from './storages.service';
import { loadDefinitionFromFile, loadModules } from './utils';

export async function loadGlobalConfigFromFile(pathOrName: string): Promise<void> {
  const definition: IGlobalConfig = loadDefinitionFromFile(pathOrName);

  return definition
    ? createGlobalConfig(definition)
    : null;
}

export async function createGlobalConfig(definition: IGlobalConfig, notThrow?: boolean): Promise<void> {
  if (definition?.type !== 'global') {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid global config definition');
  }

  if (definition.auth) {
    const authStrategiesService = Container.get(AuthStrategiesService);

    for (const auth of await loadModules(__dirname + '/auth', 'AuthStrategyService')) {
      authStrategiesService.addFactory(auth);
    }

    for (const [ defId, defConfig ] of Object.entries(definition.auth)) {
      authStrategiesService.add(authStrategiesService.getInstance(defConfig.type, defConfig.config), defId, defConfig.title, defConfig.description);
    }
  }

  if (definition.integrations) {
    const integrationsService = Container.get(IntegrationsService);

    for (const integration of await loadModules(__dirname + '/integrations', 'IntegrationService')) {
      integrationsService.addFactory(integration);
    }

    for (const [ defId, defConfig ] of Object.entries(definition.integrations)) {
      integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (definition.storages) {
    const storagesService = Container.get(StoragesService);

    for (const storage of await loadModules(__dirname + '/storages', 'StorageService')) {
      storagesService.addFactory(storage);
    }

    for (const [ defId, defConfig ] of Object.entries(definition.storages)) {
      storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }
}
