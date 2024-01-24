import 'reflect-metadata';
import Container from 'typedi';
import {FileStorageService} from './file';
import {readdirSync, statSync, unlinkSync} from 'fs';
import {MongodbStorageService} from './mongodb';
import {SqlStorageService} from './sql';

const dir = './tests';

describe('File storage', function() {
  const storages: any = [
    [ FileStorageService, { dir: './tests' } ],
    [ MongodbStorageService, { uri: 'mongodb://127.0.0.1:27017/sourceFlowTests' } ],
    [ SqlStorageService, { uri: 'postgres://postgres:postgres@127.0.0.1:5432/sourceFlowTests' } ],
  ];

  beforeAll(async () => {
    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.truncateAll();
    }
  });

  it('should set user and get same user by key and type', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.userSetByKeyAndType(userId, 'test', {
        name: userId + 'name',
      });

      expect(await storage.userGetByKeyAndType(userId, 'test')).toMatchObject({
        key: userId,
        name: userId + 'name',
        type: 'test',
      });
    }
  });

  it('should set user and not get another user by key and type', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.userSetByKeyAndType(userId, 'test', {
        name: userId + 'name',
      });

      expect(await storage.userGetByKeyAndType(userId + 'nonExisting', 'test')).toBeNull();
    }
  });

  it('should set user and get same user by filter', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.userSetByKeyAndType(userId, 'test', {
        name: userId + 'name',
      });

      expect(await storage.userGet({ key: userId, type: 'test' })).toMatchObject({
        key: userId,
        name: userId + 'name',
        type: 'test',
      });
    }
  });

  it('should set user and not get another user by filter', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.userSetByKeyAndType(userId, 'test', {
        name: userId + 'name',
      });

      expect(await storage.userGet({ key: userId + 'nonExisting', type: 'test' })).toBeNull();
    }
  });

  it('should set target var and get same target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetTarget({ id: targetId }, 'test', {
        name: targetId + 'name',
      });

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toMatchObject({
        name: targetId + 'name',
      });
    }
  });

  it('should set target var and not get another target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetTarget({ id: targetId }, 'test', {
        name: targetId + 'name',
      });

      expect(await storage.varGetTarget({ id: targetId }, 'testNonExisting')).toBeNull();
    }
  });

  it('should push to target var and get same target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varAddTarget({ id: targetId }, 'test', {
        name: targetId + 'name',
      });

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toMatchObject([ {
        name: targetId + 'name',
      } ]);

      await storage.varAddTarget({ id: targetId }, 'test', {
        name: targetId + 'namename',
      });

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toMatchObject([ {
        name: targetId + 'name',
      }, {
        name: targetId + 'namename',
      } ]);
    }
  });

  it('should increment target var and get same target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varIncTarget({ id: targetId }, 'test', 2);

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toBe(2);

      await storage.varIncTarget({ id: targetId }, 'test', -3);

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toBe(-1);
    }
  });

  it('should increment target var taking non-numeric looking value as 0 and get same target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetTarget({ id: targetId }, 'test', 'abc');
      await storage.varIncTarget({ id: targetId }, 'test', 2);
      await storage.varIncTarget({ id: targetId }, 'test', -3);

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toBe(-1);
    }
  });

  it('should set stream var and get same stream var', async () => {
    const streamId = `stream:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetStream({ id: streamId }, 'test', {
        name: streamId + 'name',
      });

      expect(await storage.varGetStream({ id: streamId }, 'test')).toMatchObject({
        name: streamId + 'name',
      });
    }
  });

  it('should set stream var and not get another stream var', async () => {
    const streamId = `stream:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetStream({ id: streamId }, 'test', {
        name: streamId + 'name',
      });

      expect(await storage.varGetStream({ id: streamId }, 'testNonExisting')).toBeNull();
    }
  });

  it('should push to stream var and get same stream var', async () => {
    const streamId = `stream:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varAddStream({ id: streamId }, 'test', {
        name: streamId + 'name',
      });

      expect(await storage.varGetStream({ id: streamId }, 'test')).toMatchObject([ {
        name: streamId + 'name',
      } ]);

      await storage.varAddStream({ id: streamId }, 'test', {
        name: streamId + 'namename',
      });

      expect(await storage.varGetStream({ id: streamId }, 'test')).toMatchObject([ {
        name: streamId + 'name',
      }, {
        name: streamId + 'namename',
      } ]);
    }
  });

  it('should increment stream var and get same stream var', async () => {
    const streamId = `stream:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varIncStream({ id: streamId }, 'test', 2);

      expect(await storage.varGetStream({ id: streamId }, 'test')).toBe(2);

      await storage.varIncStream({ id: streamId }, 'test', -3);

      expect(await storage.varGetStream({ id: streamId }, 'test')).toBe(-1);
    }
  });

  it('should increment stream var taking non-numeric looking value as 0 and get same stream var', async () => {
    const streamId = `stream:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetStream({ id: streamId }, 'test', 'abc');
      await storage.varIncStream({ id: streamId }, 'test', 2);
      await storage.varIncStream({ id: streamId }, 'test', -3);

      expect(await storage.varGetStream({ id: streamId }, 'test')).toBe(-1);
    }
  });
});
