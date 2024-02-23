import 'reflect-metadata';
import {IVersioningService} from '../versionings/versioning.service';
import {IProjectTargetDef, IProjectTargetStreamDef, Project} from '../project';
import {ProjectsService} from '../projects.service';
import {GithubStreamService} from './github';
import {StreamsService} from '../streams.service';
import Container from 'typedi';
import {IntegrationsService} from '../integrations.service';
import {GithubIntegrationService} from '../integrations/github';
import {StubVersioningService} from '../versionings/stub';
import {VersioningsService} from '../versionings.service';
import { Initial, Observer } from '@akaterra.co/unitsnap';

describe('Github stream', () => {
  const observer = new Observer();

  class TestGithubIntegrationService extends GithubIntegrationService {
    id = 'test';

    get type() {
      return 'test';
    }
  }

  class TestVersioningService extends StubVersioningService {
    id = 'test';

    get type() {
      return 'test';
    }
  }

  class TestProject extends Project {

  }

  function snapshot() {
    return observer
      .filter()
        .notPromiseResult()
      .snapshot()
        .addInstanceOfProcessor(TestGithubIntegrationService)
        .addInstanceOfProcessor(TestVersioningService)
        .includeName()
        .serialize();
  }

  beforeAll(() => {
    Container.get(ProjectsService).add(new TestProject({
      id: 'test',
      env: {
        integrations: new IntegrationsService().add(new TestGithubIntegrationService()),
        streams: new StreamsService(),
        versionings: new VersioningsService().add(new TestVersioningService()),
      },
    }));
  });

  beforeEach(() => {
    jest.restoreAllMocks();

    observer.begin();
  });

  afterEach(() => {
    observer.end();
  })

  it('should bookmark', async () => {
    const stream = new GithubStreamService();

    observer.override(TestGithubIntegrationService, {
      tagCreate: Function,
    });
    observer.override(TestProject, {
      getStreamStateByTargetIdAndStreamId: {
        history: {
          change: [ { id: 'changeId' } ],
        },
        version: 'version',
      },
    });

    await stream.streamBookmark({
      id: 'test',
      type: 'github',

      ref: {
        projectId: 'test',
      },

      config: {
        integration: 'test',
        org: 'org',
        repo: 'repo',
        branch: 'branch',
      },
    });

    expect(snapshot()).toMatchSnapshot();
  });

  it('should bookmark with stream id as repo', async () => {
    const stream = new GithubStreamService();

    observer.override(TestGithubIntegrationService, {
      tagCreate: Function,
    });
    observer.override(TestProject, {
      getStreamStateByTargetIdAndStreamId: {
        history: {
          change: [ { id: 'changeId' } ],
        },
        version: 'version',
      },
    });

    await stream.streamBookmark({
      id: 'test',
      type: 'github',

      ref: {
        projectId: 'test',
      },

      config: {
        integration: 'test',
        org: 'org',
        // repo: 'repo',
        branch: 'branch',
      },
    });

    expect(snapshot()).toMatchSnapshot();
  });

  it('should detach', async () => {
    const stream = new GithubStreamService();

    observer.override(TestGithubIntegrationService, {
      branchDelete: Function,
    });
    observer.override(TestProject, {
      getEnvIntegraionByTargetStream: Initial,
      getEnvVersioningByTarget: Initial,
      getTargetByTargetStream: {
        id: 'testTarget',
        type: 'test',

        versioning: 'test',
      },
    });
    observer.override(TestVersioningService, {
      getCurrent: Promise.resolve('testBranch'),
    });

    await stream.streamDetach({
      id: 'test',
      type: 'github',

      ref: {
        projectId: 'test',
      },

      config: {
        integration: 'test',
        org: 'org',
        repo: 'repo',
        branch: 'branch',
      },
    });

    expect(snapshot()).toMatchSnapshot();
  });

  it('should detach with stream id as repo', async () => {
    const stream = new GithubStreamService();

    observer.override(TestGithubIntegrationService, {
      branchDelete: Function,
    });
    observer.override(TestProject, {
      getEnvIntegraionByTargetStream: Initial,
      getEnvVersioningByTarget: Initial,
      getTargetByTargetStream: {
        id: 'testTarget',
        type: 'test',

        versioning: 'test',
      },
    });
    observer.override(TestVersioningService, {
      getCurrent: Promise.resolve('testBranch'),
    });

    await stream.streamDetach({
      id: 'test',
      type: 'github',

      ref: {
        projectId: 'test',
      },

      config: {
        integration: 'test',
        org: 'org',
        // repo: 'repo',
        branch: 'branch',
      },
    });

    expect(snapshot()).toMatchSnapshot();
  });
});
