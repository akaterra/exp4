import Container from 'typedi';
import { IntegrationsService } from './integrations.service';
import { IGeneralManifest } from './global-config';
import { AuthStrategiesService } from './auth-strategies.service';
import { StoragesService } from './storages.service';
import { loadModules } from './utils';

export async function createGeneral(manifest: IGeneralManifest, notThrow?: boolean): Promise<void> {
  if (manifest?.type !== 'general') {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid general manifest');
  }

  if (manifest.auth) {
    const authStrategiesService = Container.get(AuthStrategiesService);

    for (const auth of await loadModules(__dirname + '/auth', 'AuthStrategyService')) {
      authStrategiesService.addFactory(auth);
    }

    for (const [ defId, defConfig ] of Object.entries(manifest.auth)) {
      authStrategiesService.add(authStrategiesService.getInstance(defConfig.type, defConfig.config), defId, defConfig.title, defConfig.description);
    }
  }

  if (manifest.integrations) {
    const integrationsService = Container.get(IntegrationsService);

    for (const integration of await loadModules(__dirname + '/integrations', 'IntegrationService')) {
      integrationsService.addFactory(integration);
    }

    for (const [ defId, defConfig ] of Object.entries(manifest.integrations)) {
      integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (manifest.storages) {
    const storagesService = Container.get(StoragesService);

    for (const storage of await loadModules(__dirname + '/storages', 'StorageService')) {
      storagesService.addFactory(storage);
    }

    for (const [ defId, defConfig ] of Object.entries(manifest.storages)) {
      storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }
}
