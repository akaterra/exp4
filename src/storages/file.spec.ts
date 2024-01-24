import 'reflect-metadata';
import Container from 'typedi';
import {FileStorageService} from './file';
import {readdirSync, statSync, unlinkSync} from 'fs';

const dir = './tests';

describe('File storage', function() {
  beforeAll(() => {
    for (const file of readdirSync(dir)) {
      const name = `${dir}/${file}`;

      if (!statSync(name).isDirectory() && file !== '.gitignore') {
        unlinkSync(name);
      }
    }
  });

  it('should set user and get same user by id', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;
    const storage = new FileStorageService({
      dir: './tests',
    });

    await storage.userSet(userId, 'test', {
      name: userId + 'name',
    });

    expect(await storage.userGetById(userId)).toMatchObject({
      id: userId,
      name: userId + 'name',
      type: 'test',
    });
  });

  it('should set user and not get another user by id', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;
    const storage = new FileStorageService({
      dir: './tests',
    });

    await storage.userSet(userId, 'test', {
      name: userId + 'name',
    });

    expect(await storage.userGetById(userId + 'nonExisting')).toBeNull();
  });

  it('should set user and get same user by filter', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;
    const storage = new FileStorageService({
      dir: './tests',
    });

    await storage.userSet(userId, 'test', {
      name: userId + 'name',
    });

    expect(await storage.userGet({ id: userId, type: 'test' })).toMatchObject({
      id: userId,
      name: userId + 'name',
      type: 'test',
    });
  });

  it('should set user and not get another user by filter', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;
    const storage = new FileStorageService({
      dir: './tests',
    });

    await storage.userSet(userId, 'test', {
      name: userId + 'name',
    });

    expect(await storage.userGet({ id: userId + 'nonExisting', type: 'test' })).toBeNull();
  });

  it('should set target var and get same target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;
    const storage = new FileStorageService({
      dir: './tests',
    });

    await storage.varSetTarget({ id: targetId }, 'test', {
      name: targetId + 'name',
    });

    expect(await storage.varGetTarget({ id: targetId }, 'test')).toMatchObject({
      name: targetId + 'name',
    });
  });

  it('should set target var and not get another target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;
    const storage = new FileStorageService({
      dir: './tests',
    });

    await storage.varSetTarget({ id: targetId }, 'test', {
      name: targetId + 'name',
    });

    expect(await storage.varGetTarget({ id: targetId }, 'testNonExisting')).toBeNull();
  });
});
