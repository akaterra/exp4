import 'reflect-metadata';
import Container from 'typedi';
import {FileStorageService} from './file';
import {readdirSync, statSync, unlinkSync} from 'fs';
import {MongodbStorageService} from './mongodb';
import {SqlStorageService} from './sql';
import {ExternalRestServiceStorageService} from './external-rest-service';
import express from 'express';
import {RestApiService} from '../services/rest-api.service';
import {StoragesService} from '../storages.service';

const dir = './tests';

describe('File storage', function() {
  const storages: [ any, any, ((data?: any[]) => { calls: any[] })? ][] = [
    [ FileStorageService, { dir: './tests' } ],
    [ MongodbStorageService, { uri: 'mongodb://127.0.0.1:27017/sourceFlowTests' } ],
    [ SqlStorageService, { uri: 'postgres://postgres:postgres@127.0.0.1:5432/sourceFlowTests' } ],
    [
      ExternalRestServiceStorageService,
      null,
      (data?: any[]) => {
        let moduleData: any[] = data ?? [];
        let calls: any[] = [];

        const injection = {
          configure: function () {
            return this;
          },
          withHeaders: function () {
            return this;
          },
          delete: async function (...args) {
            calls.push([ 'delete', args ]);

            return moduleData.shift();
          },
          get: async function (...args) {
            calls.push([ 'get', args ]);

            return moduleData.shift();
          },
          post: async function (...args) {
            calls.push([ 'post', args ]);

            return moduleData.shift();
          },
        };

        Container.set(RestApiService, injection);

        return {
          calls,
        };
      },
    ]
  ];

  beforeAll(async () => {
    for (const [ Class, config, init ] of storages) {
      if (init) {
        init();
      }

      const storage = new Class(config);

      await storage.truncateAll();
    }
  });

  afterAll(() => {
    Container.set(RestApiService, RestApiService);
  });

  it.only('should set users with same key but different types and get valid user by key and type', async () => {
    const userId = `user:${Date.now()}:${Math.random()}`;
    const callsData = {
      [ String(ExternalRestServiceStorageService) ]: [
        null,
        null,
        { key: userId, name: userId + 'name', type: 'test' },
        { key: userId, name: userId + 'name2', type: 'test2' },
      ],
    };
    const callsAssertions = {
      [ String(ExternalRestServiceStorageService) ]: [
        [ 'post', [ 'http://localhost:7000/user', { key: userId, name: userId + 'name', type: 'test' } ] ],
        [ 'post', [ 'http://localhost:7000/user', { key: userId, name: userId + 'name2', type: 'test2' } ] ],
        [ 'get', [ 'http://localhost:7000/user', { key: userId, type: 'test' } ] ],
        [ 'get', [ 'http://localhost:7000/user', { key: userId, type: 'test2' } ] ],
      ],
    };

    for (const [ Class, config, init ] of storages) {
      let calls;

      if (init) {
        calls = init(callsData[Class]).calls;
      }

      const storage = new Class(config);

      await storage.userSetByKeyAndType(userId, 'test', {
        name: userId + 'name',
      });
      await storage.userSetByKeyAndType(userId, 'test2', {
        name: userId + 'name2',
      });

      expect(await storage.userGetByKeyAndType(userId, 'test')).toMatchObject({
        key: userId,
        name: userId + 'name',
        type: 'test',
      });
      expect(await storage.userGetByKeyAndType(userId, 'test2')).toMatchObject({
        key: userId,
        name: userId + 'name2',
        type: 'test2',
      });

      if (init && callsAssertions[Class]) {
        expect(calls).toMatchObject(callsAssertions[Class]);
      }
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

  it('should set target vars with same key and different types and get valid target var', async () => {
    const targetId = `target:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetTarget({ id: targetId }, 'test', {
        name: targetId + 'name',
      });
      await storage.varSetTarget({ id: targetId }, 'test2', {
        name: targetId + 'name2',
      });

      expect(await storage.varGetTarget({ id: targetId }, 'test')).toMatchObject({
        name: targetId + 'name',
      });
      expect(await storage.varGetTarget({ id: targetId }, 'test2')).toMatchObject({
        name: targetId + 'name2',
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

  it('should set streams var with same keys and different types and get valid stream var', async () => {
    const streamId = `stream:${Date.now()}:${Math.random()}`;

    for (const [ Class, config ] of storages) {
      const storage = new Class(config);

      await storage.varSetStream({ id: streamId }, 'test', {
        name: streamId + 'name',
      });
      await storage.varSetStream({ id: streamId }, 'test2', {
        name: streamId + 'name2',
      });

      expect(await storage.varGetStream({ id: streamId }, 'test')).toMatchObject({
        name: streamId + 'name',
      });
      expect(await storage.varGetStream({ id: streamId }, 'test2')).toMatchObject({
        name: streamId + 'name2',
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
