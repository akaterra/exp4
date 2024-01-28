import { Service } from 'typedi';
import { IStorageService } from './storage.service';
import { AwaitedCache } from '../cache';
import { IProjectManifest, IProjectTargetDef, IProjectTargetStreamDef } from '../project';
import { EntityService } from '../entities.service';
import { IUser } from '../user';
import { Log } from '../logger';
import fs, { readFile, readdir, stat, unlink } from 'node:fs/promises';
import path from 'path';
import { IGeneralManifest } from '../general';
import { lstat } from 'node:fs/promises';
import { iter } from '../utils';
import YAML from 'yaml'

@Service()
export class FileStorageService extends EntityService implements IStorageService {
  static readonly type: string = 'file';

  protected cache = new AwaitedCache();

  constructor(protected config?: { dir? }) {
    super();
  }

  @Log('debug')
  async manifestsLoad(source: string | string[]): Promise<Array<IGeneralManifest | IProjectManifest>> {
    const manifests: Array<IGeneralManifest | IProjectManifest> = [];

    for (const [ ,maybeSource ] of iter(source)) {
      let path;

      if (maybeSource.startsWith('file://')) {
        path = maybeSource.slice(7);
      } else {
        const stat = await lstat(maybeSource).catch(() => {
          return null;
        });

        if (stat && (stat.isDirectory() || stat.isFile())) {
          path = maybeSource;
        }
      }

      if (path) {
        const stat = await lstat(maybeSource);
        const filesToCheck: string[] = [];

        if (stat.isDirectory()) {
          for (const stat of await readdir(path, { withFileTypes: true })) {
            if (stat.isFile()) {
              filesToCheck.push(`${path}/${stat.name}`);
            }
          }
        } else if (stat.isFile()) {
          filesToCheck.push(path);
        } else {
          continue;
        }

        for (const file of filesToCheck) {
          const fileContent = await readFile(file, 'utf8');
          let manifest: IGeneralManifest | IProjectManifest;

          switch (file.slice(file.lastIndexOf('.') + 1)) {
          case 'json':
            manifest = JSON.parse(fileContent);
            break;
          case 'yaml':
            manifest = YAML.parse(fileContent);
            break;
          case 'yml':
            manifest = YAML.parse(fileContent);
            break;  
          }

          if (manifest && typeof manifest === 'object') {
            if (!manifest.id) {
              manifest.id = file.slice(file.lastIndexOf('/') + 1, file.lastIndexOf('.'));
            }

            manifests.push(manifest);
          }
        }
      }
    }

    return manifests;
  }

  @Log('debug')
  async userGet(filter: Record<string, unknown>): Promise<IUser> {
    return Object.values(await this.getJson('users') ?? {}).find((entity) => {
      return Object.entries(filter).every(([ key, val ]) => {
        return val === entity[key];
      });
    }) ?? null;
  }

  @Log('debug')
  async userGetByKeyAndType(key: string, type: string): Promise<IUser> {
    return (await this.getJson('users'))?.[`${key}:${type}`] ?? null;
  }

  @Log('debug')
  async userSetByKeyAndType(key: string, type: string, data: Record<string, unknown>): Promise<void> {
    const users = await this.getJson('users') ?? {};
    users[`${key}:${type}`] = { ...users[`${key}:${type}`], ...data, key, type };
    
    await this.putJson('users', users);
  }

  @Log('debug')
  async varGetTarget<D>(target: Pick<IProjectTargetDef, 'id'>, key: string | string[], def: D = null): Promise<D> {
    const intKey = FileStorageService.getKeyOfType(key, target.id, 'target');
    const cacheKey = `${intKey}:target`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    return (await this.getJson(intKey)) ?? def;
  }

  @Log('debug')
  async varSetTarget<D>(target: Pick<IProjectTargetDef, 'id'>, key: string | string[], val: D = null): Promise<void> {
    const intKey = FileStorageService.getKeyOfType(key, target.id, 'target');

    await this.putJson(intKey, val);

    this.cache.set(`${intKey}:target`, val, 10);
  }

  @Log('debug')
  async varAddTarget<D>(
    target: Pick<IProjectTargetDef, 'id'>,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGetTarget(target, key, null);

    if (Array.isArray(intVal)) {
      if (uniq) {
        if (uniq === true) {
          if (intVal.includes(val)) {
            return val;
          }
        } else {
          if (intVal.some((valExisting) => uniq(valExisting, val))) {
            return val;
          }
        }
      }

      intVal.push(val);
    } else {
      intVal = [ val ];
    }

    if (maxLength) {
      intVal = intVal.slice(-maxLength);
    }

    await this.varSetTarget(target, key, intVal);

    return val;
  }

  @Log('debug')
  async varIncTarget(target: Pick<IProjectTargetDef, 'id'>, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetTarget(target, key, '0'));

    await this.varSetTarget(target, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  async varGetStream<D>(stream: Pick<IProjectTargetStreamDef, 'id'>, key: string | string[], def: D = null): Promise<D> {
    const intKey = FileStorageService.getKeyOfType(key, stream.id);
    const cacheKey = `${intKey}:stream`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }
    
    return (await this.getJson(intKey)) ?? def;
  }

  @Log('debug')
  async varSetStream<D>(stream: Pick<IProjectTargetStreamDef, 'id'>, key: string | string[], val: D = null): Promise<void> {
    const intKey = FileStorageService.getKeyOfType(key, stream.id);

    await this.putJson(intKey, val);

    this.cache.set(`${intKey}:stream`, val, 10);
  }

  @Log('debug')
  async varAddStream<D>(
    stream: Pick<IProjectTargetStreamDef, 'id'>,
    key: string | string[],
    val: D,
    uniq?: boolean | ((valExising: D, valNew: D) => boolean),
    maxLength?: number,
  ): Promise<D> {
    let intVal = await this.varGetStream(stream, key, null);

    if (Array.isArray(intVal)) {
      if (uniq) {
        if (uniq === true) {
          if (intVal.includes(val)) {
            return val;
          }
        } else {
          if (intVal.some((valExisting) => uniq(valExisting, val))) {
            return val;
          }
        }
      }

      intVal.push(val);
    } else {
      intVal = [ val ];
    }

    if (maxLength) {
      intVal = intVal.slice(-maxLength);
    }

    await this.varSetStream(stream, key, intVal);

    return val;
  }

  @Log('debug')
  async varIncStream(stream: Pick<IProjectTargetStreamDef, 'id'>, key: string | string[], add: number): Promise<number> {
    const intVal = parseInt(await this.varGetStream(stream, key, '0'));

    await this.varSetStream(stream, key, !isNaN(intVal) ? intVal + add : add);

    return intVal;
  }

  async truncateAll() {
    const dir = this.getDir();

    for (const file of await readdir(dir)) {
      const name = `${dir}/${file}`;

      if (!(await stat(name)).isDirectory() && file !== '.gitignore') {
        await unlink(name);
      }
    }
  }

  protected static getKey(key: string | string[]): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}`.toLowerCase().replace(/\-/g, '_');
  }

  protected static getKeyOfType(key: string | string[], id: IProjectTargetStreamDef['id'], type?: string): string {
    key = Array.isArray(key) ? key.join('__') : key;

    return `${key}__${type ?? 'stream'}__${id}`.toLowerCase().replace(/\-/g, '_');
  }

  protected getJsonPath(file: string): string {
    file = encodeURI(file).replace(/\//g, '__');

    return path.resolve(this.getDir(), `${file}.json`);
  }

  protected getJson<T = unknown>(file: string): Promise<T> {
    return fs.readFile(this.getJsonPath(file), 'utf8').then(JSON.parse).catch(() => null);
  }

  protected putJson(file: string, json: any): Promise<unknown> {
    return fs.writeFile(this.getJsonPath(file), JSON.stringify(json), 'utf8');
  }

  protected getDir() {
    return this.config?.dir ?? './projects';
  }
}
