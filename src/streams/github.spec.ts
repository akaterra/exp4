import 'reflect-metadata';
import {IVersioningService} from '../versionings/versioning.service';
import {IProjectTargetDef, IProjectTargetStreamDef, Project} from '../project';
import {ProjectsService} from '../projects.service';
import {GithubStreamService} from './github';
import {StreamsService} from '../streams.service';
import Container from 'typedi';
import {IntegrationsService} from '../integrations.service';
import {GithubIntegrationService} from '../integrations/github';

describe('Github stream', () => {
  class TestGithubIntegrationService extends GithubIntegrationService {
    id = 'test';

    get type() {
      return 'test';
    }

    async tagCreate() {
      return null;
    }
  }

  class TestProject extends Project {
    getEnvVersioningByTarget() {
      return null;
    }

    getStreamStateByTargetIdAndStreamId() {
      return null;
    }

    getTargetByTargetStream() {
      return null;
    }
  }

  beforeAll(() => {
    Container.get(ProjectsService).add(new TestProject({
      id: 'test',
      env: {
        integrations: new IntegrationsService().add(new TestGithubIntegrationService()),
        streams: new StreamsService(),
      },
    }));
  });

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should bookmark', async () => {
    const stream = new GithubStreamService();

    const tagCreateSpy = jest.spyOn(TestGithubIntegrationService.prototype, 'tagCreate');
    jest.spyOn(TestProject.prototype, 'getStreamStateByTargetIdAndStreamId').mockReturnValue({
      history: {
        change: [ { id: 'changeId' } ],
      },
      version: 'version',
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

    expect(tagCreateSpy).toHaveBeenCalledTimes(1);
    expect(tagCreateSpy.mock.calls[0]).toMatchObject([ 'changeId', 'version', null, 'repo', null, false ]);
  });

  it('should bookmark with id as repo', async () => {
    const stream = new GithubStreamService();

    const tagCreateSpy = jest.spyOn(TestGithubIntegrationService.prototype, 'tagCreate');
    jest.spyOn(TestProject.prototype, 'getStreamStateByTargetIdAndStreamId').mockReturnValue({
      history: {
        change: [ { id: 'changeId' } ],
      },
      version: 'version',
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

    expect(tagCreateSpy).toHaveBeenCalledTimes(1);
    expect(tagCreateSpy.mock.calls[0]).toMatchObject([ 'changeId', 'version', null, 'test', null, false ]);
  });
});
