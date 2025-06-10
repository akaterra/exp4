import { IProjectManifest, Project } from '../project';
import { IntegrationHolderService } from '../integrations';
import { StorageHolderService } from '../storages';
import { StreamHolderService } from '../streams';
import { ActionHolderService } from '../actions';
import { VersioningHolderService } from '../versionings';
import { TargetHolderService } from '../targets';
import { CallbacksContainer, iter, loadModules } from '../utils';
import { ArtifactHolderService } from '../artifacts';
import * as _ from 'lodash';
import { MANIFEST_PROJECT_TYPE } from '../const';
import { ValidatorService } from '../services/validator.service';
import { ExtensionHolderService } from '../extensions';

export async function createProject(
  manifest: IProjectManifest & { env?: Project['env'] },
  notThrow?: boolean,
  targets?: Record<string, boolean | Record<string, boolean>>,
): Promise<Project> {
  if (manifest?.type !== MANIFEST_PROJECT_TYPE) {
    if (notThrow) {
      return null;
    }

    throw new Error('Invalid project manifest');
  }

  const callbacksContainer = new CallbacksContainer();

  manifest.env = {
    actions: new ActionHolderService(),
    artifacts: new ArtifactHolderService(),
    callbacksContainer,
    extensions: new ExtensionHolderService(callbacksContainer),
    integrations: new IntegrationHolderService(),
    storages: new StorageHolderService(),
    streams: new StreamHolderService(callbacksContainer),
    targets: new TargetHolderService(callbacksContainer),
    validator: new ValidatorService(),
    versionings: new VersioningHolderService(),
  }

  for (const integration of await loadModules(__dirname + '/../integrations', 'IntegrationService')) {
    manifest.env.integrations.addFactory(integration);
  }

  for (const action of await loadModules(__dirname + '/../actions', 'ActionService')) {
    manifest.env.actions.addFactory(action);
  }

  for (const artifact of await loadModules(__dirname + '/../artifacts', 'ArtifactService')) {
    manifest.env.artifacts.addFactory(artifact);
  }

  for (const extension of await loadModules(__dirname + '/../extensions', 'ExtensionService')) {
    manifest.env.extensions.addFactory(extension);
  }

  for (const storage of await loadModules(__dirname + '/../storages', 'StorageService')) {
    manifest.env.storages.addFactory(storage);
  }

  for (const stream of await loadModules(__dirname + '/../streams', 'StreamService')) {
    manifest.env.streams.addFactory(stream);
  }

  for (const versioning of await loadModules(__dirname + '/../versionings', 'VersioningService')) {
    manifest.env.versionings.addFactory(versioning);
  }

  resolveUse(manifest.artifacts, manifest);
  resolveUse(manifest.definitions, manifest);
  resolveUse(manifest.extensions, manifest);
  resolveUse(manifest.flows, manifest);
  resolveUse(manifest.integrations, manifest);
  resolveUse(manifest.storages, manifest);
  resolveUse(manifest.targets, manifest);
  resolveUse(manifest.versionings, manifest);

  const actionsService = manifest.env.actions;
  const artifactsService = manifest.env.artifacts;
  const extensionsService = manifest.env.extensions;
  const integrationsService = manifest.env.integrations;
  const storagesService = manifest.env.storages;
  const streamsService = manifest.env.streams;
  const versioningsService = manifest.env.versionings;

  if (manifest.extensions) {
    for (const [ defId, defConfig ] of Object.entries(manifest.extensions)) {
      const instance = extensionsService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);

      if (defConfig.events) {
        instance.registerEvents(defConfig.events);
      }

      instance.registerCallbacks(callbacksContainer);
      extensionsService.add(instance, defId);
    }
  }

  if (manifest.integrations) {
    for (const [ defId, defConfig ] of Object.entries(manifest.integrations)) {
      const instance = integrationsService.getInstance(defConfig.type);
      instance.configure(defConfig.config);
      integrationsService.add(instance, defId);
    }
  }

  if (manifest.storages) {
    for (const [ defId, defConfig ] of Object.entries(manifest.storages)) {
      const instance = storagesService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);
      storagesService.add(instance, defId);
    }
  }

  if (manifest.versionings) {
    for (const [ defId, defConfig ] of Object.entries(manifest.versionings).concat([ [ null, { type: null } ] ])) {
      const instance = versioningsService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);
      versioningsService.add(instance, defId);
    }
  }

  if (manifest.artifacts) {
    for (const [ defId, defConfig ] of Object.entries(manifest.artifacts)) {
      const instance = artifactsService.getInstance(defConfig.type, defConfig.config);
      instance.configure(defConfig.config);
      artifactsService.add(instance, defId);
    }
  }

  if (manifest.flows) {
    for (const [ ,flow ] of Object.entries(manifest.flows)) {
      flow.actions?.forEach((action) => {
        if (!actionsService.has(action.type)) {
          const instance = actionsService.getInstance(action.type, action.config);
          instance.configure(action.config);
          actionsService.add(instance, action.type);
        }
      });
    }
  }

  if (manifest.targets) {
    for (const [ targetDefId, targetDefConfig ] of Object.entries(manifest.targets)) {
      if (targets && !targets[targetDefId]) {
        delete manifest.targets[targetDefId];

        continue;
      }

      for (const [ streamDefId, streamDefConfig ] of Object.entries(targetDefConfig.streams)) {
        if (targets && targets[targetDefId] !== true && !targets[targetDefId]?.[streamDefId]) {
          delete targetDefConfig.streams?.[streamDefId];

          continue;
        }  

        streamDefConfig.artifacts?.forEach((artifact) => {
          artifactsService.get(artifact);
        });

        if (!streamsService.has(streamDefConfig.type)) {
          streamsService.add(streamsService.getInstance(streamDefConfig.type, streamDefConfig.config), streamDefConfig.type);
        }
      }

      versioningsService.get(targetDefConfig.versioning);
    }
  }

  return new Project(manifest);
}

function resolveUse(section, definition, sectionKey = null) {
  if (!sectionKey) {
    sectionKey = [];
  }

  if (section) {
    if (Array.isArray(section)) {
      section.forEach((subSection, i) => {
        sectionKey.push(i);
        resolveUse(subSection, definition, sectionKey)
        sectionKey.pop(i);
      });
    } else if (typeof section === 'object') {
      if (section.use) {
        for (let [ ,sectionUse ] of iter(section.use as string)) {
          if (sectionKey && sectionUse.includes('%')) {
            sectionUse = sectionUse.split('.').map((key) => {
              if (key.charAt(0) === '%') {
                if (key.length === 1) {
                  return sectionKey[sectionKey.length - 1];
                } else {
                  const index = parseInt(key.slice(1), 10);

                  if (index < 0) {
                    return sectionKey[sectionKey.length + index - 1] ?? key;
                  } else {
                    return sectionKey[index - 1] ?? key;
                  }
                }
              }

              return key;
            }).join('.');
          }
  
          const use = _.get(definition, sectionUse);
  
          if (use && typeof use === 'object') {
            for (const [ key, val ] of Object.entries(use)) {
              if (section[key] === undefined) {
                section[key] = _.cloneDeep(val);
              }
            }
          }
        }

        delete section.use;
      }

      for (const [ subSectionKey, subSection ] of Object.entries(section)) {
        sectionKey.push(subSectionKey);
        resolveUse(subSection, definition, sectionKey);
        sectionKey.pop();
      }
    }
  }

  return section;
}
