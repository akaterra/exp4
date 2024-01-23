import { IProjectManifest, Project } from './project';
import { IntegrationsService } from './integrations.service';
import { StoragesService } from './storages.service';
import { StreamsService } from './streams.service';
import { StepsService } from './steps.service';
import { VersioningsService } from './versionings.service';
import { TargetsService } from './targets.service';
import { iter, loadModules } from './utils';
import { ArtifactsService } from './artifacts.service';
import * as _ from 'lodash';
import { MANIFEST_PROJECT_TYPE } from './const';
import { ValidatorService } from './validator.service';

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
    artifacts: new ArtifactsService(),
    steps: new StepsService(),
    integrations: new IntegrationsService(),
    storages: new StoragesService(),
    streams: new StreamsService(),
    targets: new TargetsService(),
    validator: new ValidatorService(),
    versionings: new VersioningsService(),
  }

  for (const artifact of await loadModules(__dirname + '/artifacts', 'ArtifactService')) {
    manifest.env.artifacts.addFactory(artifact);
  }

  for (const integration of await loadModules(__dirname + '/integrations', 'IntegrationService')) {
    manifest.env.integrations.addFactory(integration);
  }

  for (const step of await loadModules(__dirname + '/steps', 'StepService')) {
    manifest.env.steps.addFactory(step);
  }

  for (const storage of await loadModules(__dirname + '/storages', 'StorageService')) {
    manifest.env.storages.addFactory(storage);
  }

  for (const stream of await loadModules(__dirname + '/streams', 'StreamService')) {
    manifest.env.streams.addFactory(stream);
  }

  for (const versioning of await loadModules(__dirname + '/versionings', 'VersioningService')) {
    manifest.env.versionings.addFactory(versioning);
  }

  resolveUse(manifest.artifacts, manifest);
  resolveUse(manifest.definitions, manifest);
  resolveUse(manifest.flows, manifest);
  resolveUse(manifest.integrations, manifest);
  resolveUse(manifest.storages, manifest);
  resolveUse(manifest.targets, manifest);
  resolveUse(manifest.versionings, manifest);

  const artifactsService = manifest.env.artifacts;
  const integrationsService = manifest.env.integrations;
  const stepsService = manifest.env.steps;
  const storagesService = manifest.env.storages;
  const streamsService = manifest.env.streams;
  const versioningsService = manifest.env.versionings;

  if (manifest.artifacts) {
    for (const [ defId, defConfig ] of Object.entries(manifest.artifacts)) {
      artifactsService.add(artifactsService.getInstance(defConfig.type, defConfig.config), defId);
    }
  }

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

  if (manifest.flows) {
    for (const [ ,flow ] of Object.entries(manifest.flows)) {
      flow.steps?.forEach((step) => {
        if (!stepsService.has(step.type)) {
          stepsService.add(stepsService.getInstance(step.type, step.config), step.type);
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
