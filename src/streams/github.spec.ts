import 'reflect-metadata';
// import 'source-map-support/register';
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
import { Observe, Observer, SnapshotStorageFormat } from '@akaterra.co/unitsnap';

describe('Github stream', () => {
  const observer = Observer();

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
    const snapshot = observer
      .filter()
        .notPromiseResult()
      .snapshot()
        .addInstanceOfProcessor(TestGithubIntegrationService)
        .addInstanceOfProcessor(TestVersioningService)
        .includeCaller()
        .includeName()
        .serialize(SnapshotStorageFormat.COMPACT);

    return snapshot;
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
      tagCreate: undefined,
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
      tagCreate: undefined,
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
      branchDelete: undefined,
    });
    observer.override(TestProject, {
      getEnvIntegraionByTargetStream: Observe,
      getEnvVersioningByTarget: Observe,
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
      branchDelete: undefined,
    });
    observer.override(TestProject, {
      getEnvIntegraionByTargetStream: Observe,
      getEnvVersioningByTarget: Observe,
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

  it('should get state', async () => {
    const stream = new GithubStreamService();

    observer.override(TestGithubIntegrationService, {
      branchGet: {
        commit: {
          sha: 'commitSha',
          commit: {
            author: {
              name: 'commitAuthorName',
              html_url: 'commitAuthorLink',
            },
            committer: {
              date: '2020-01-01',
            },
            message: 'commitMessage',
          },
          html_url: 'commitLink',
        },
        _links: {
          html: 'branchLink',
        },
      },
      workflowRunsGet: [ {
        id: 'workflowId',
        actor: { name: 'workflowActorName', html_url: 'workflowActorLink' },
        status: 'success',
      } ],
      workflowJobsGet: [ {
        id: 'workflowJobId',
        html_url: 'workflowJobLink',
        steps: [ {
          name: 'workflowJobName',
          number: 1,
          conclusion: 'success',
          started_at: '2020-01-01',
          completed_at: '2020-01-02',
        } ],
      } ],
    });
    observer.override(TestProject, {
      getEnvIntegraionByTargetStream: Observe,
      getEnvVersioningByTarget: Observe,
      getTargetByTargetStream: {
        id: 'testTarget',
        type: 'test',

        versioning: 'test',
      },
    });
    observer.override(TestVersioningService, {
      getCurrent: Promise.resolve('testBranch'),
    });
    observer.override(GithubStreamService, {
      streamGetState: Observe,
    });

    await stream.streamGetState({
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

      artifacts: [ 'test' ],
    }, { '*': true }, {});

    expect(snapshot()).toMatchSnapshot();
  });
});
