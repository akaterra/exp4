import { IProjectManifest, Project } from '../project';
import { IntegrationHolderService } from '../integrations';
import { StorageHolderService } from '../storages';
import { StreamHolderService } from '../streams';
import { ActionHolderService } from '../actions';
import { VersioningHolderService } from '../versionings';
import { TargetHolderService } from '../targets';
import { iter, loadModules } from '../utils';
import { ArtifactHolderService } from '../artifacts';
import * as _ from 'lodash';
import { MANIFEST_PROJECT_TYPE } from '../const';
import { ValidatorService } from '../services/validator.service';
import { NotificationHolderService } from '../notifications';

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

  manifest.env = {
    actions: new ActionHolderService(),
    artifacts: new ArtifactHolderService(),
    integrations: new IntegrationHolderService(),
    notifications: new NotificationHolderService(),
    storages: new StorageHolderService(),
    streams: new StreamHolderService(),
    targets: new TargetHolderService(),
    validator: new ValidatorService(),
    versionings: new VersioningHolderService(),
  }

  for (const action of await loadModules(__dirname + '/../actions', 'ActionService')) {
    manifest.env.actions.addFactory(action);
  }

  for (const artifact of await loadModules(__dirname + '/../artifacts', 'ArtifactService')) {
    manifest.env.artifacts.addFactory(artifact);
  }

  for (const integration of await loadModules(__dirname + '/../integrations', 'IntegrationService')) {
    manifest.env.integrations.addFactory(integration);
  }

  for (const notification of await loadModules(__dirname + '/../notifications', 'NotificationService')) {
    manifest.env.notifications.addFactory(notification);
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
  resolveUse(manifest.flows, manifest);
  resolveUse(manifest.integrations, manifest);
  resolveUse(manifest.storages, manifest);
  resolveUse(manifest.targets, manifest);
  resolveUse(manifest.versionings, manifest);

  const actionsService = manifest.env.actions;
  const artifactsService = manifest.env.artifacts;
  const integrationsService = manifest.env.integrations;
  const storagesService = manifest.env.storages;
  const streamsService = manifest.env.streams;
  const versioningsService = manifest.env.versionings;

  if (manifest.integrations) {
    for (const [ defId, defConfig ] of Object.entries(manifest.integrations)) {
      integrationsService.add(integrationsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (manifest.storages) {
    for (const [ defId, defConfig ] of Object.entries(manifest.storages)) {
      storagesService.add(storagesService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (manifest.versionings) {
    for (const [ defId, defConfig ] of Object.entries(manifest.versionings).concat([ [ null, { type: null } ] ])) {
      versioningsService.add(versioningsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (manifest.artifacts) {
    for (const [ defId, defConfig ] of Object.entries(manifest.artifacts)) {
      artifactsService.add(artifactsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

  if (manifest.flows) {
    for (const [ ,flow ] of Object.entries(manifest.flows)) {
      flow.actions?.forEach((action) => {
        if (!actionsService.has(action.type)) {
          actionsService.add(actionsService.getInstance(action.type, action.config), action.type);
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

      manifest.env.versionings.get(targetDefConfig.versioning);
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
