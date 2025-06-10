import Container from 'typedi';
import { IntegrationHolderService } from '../integrations';
import { IGeneralManifest } from '../general';
import { AuthStrategyHolderService } from '../auth/index';
import { StorageHolderService } from '../storages';
import { loadModules } from '../utils';
import { MANIFEST_GENERAL_TYPE } from '../const';

export async function createGeneral(manifest: IGeneralManifest, notThrow?: boolean): Promise<void> {
  if (manifest?.type !== MANIFEST_GENERAL_TYPE) {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid general manifest');
  }

  if (manifest.auth) {
    const authStrategiesService = Container.get(AuthStrategyHolderService);

    for (const auth of await loadModules(__dirname + '/../auth', 'AuthStrategyService')) {
      authStrategiesService.addFactory(auth);
    }

    for (const [ defId, defConfig ] of Object.entries(manifest.auth)) {
      const instance = authStrategiesService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);
      authStrategiesService.add(instance, defId, defConfig.title, defConfig.description);
    }
  }

  if (manifest.integrations) {
    const integrationsService = Container.get(IntegrationHolderService);

    for (const integration of await loadModules(__dirname + '/../integrations', 'IntegrationService')) {
      integrationsService.addFactory(integration);
    }

    for (const [ defId, defConfig ] of Object.entries(manifest.integrations)) {
      const instance = integrationsService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);
      integrationsService.add(instance, defId);
    }
  }

  if (manifest.storages) {
    const storagesService = Container.get(StorageHolderService);

    for (const storage of await loadModules(__dirname + '/../storages', 'StorageService')) {
      storagesService.addFactory(storage);
    }

    for (const [ defId, defConfig ] of Object.entries(manifest.storages)) {
      const instance = storagesService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);
      storagesService.add(instance, defId);
    }
  }
}
