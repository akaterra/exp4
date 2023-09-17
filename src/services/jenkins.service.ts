import { request } from '../utils';
import { rest } from './rest-api.service';

export class JenkinsService {
  constructor(
    private host: string = process.env.JENKINS_HOST,
  ) {
  }

  async getJobRuns(name: string) {
    const jobRuns = await rest.doRequest(
      `${this.host}/job/${name}/wfapi/runs?fullStages=true&_=${Date.now()}`,
      'get',
    );

    return [];

    // return jobRuns.find(())
  }

  async getLastJobRunLog(name: string, stageName: string, stageFlowName: string) {
    const jobRuns = await this.getJobRuns(name);

    if (jobRuns?.[0]) {
      const stage = jobRuns[0].stages.find((stage) => stage.name === stageName);

      if (stage) {
        const stageFlow = stage.stageFlowNodes.find((stageFlow) => stageFlow.name === stageFlowName);

        if (stageFlow?._links?.log?.href) {
          return rest.withFormat('text').doRequest(`${this.host}${stageFlow?._links?.log?.href}`, 'get');
        }
      }
    }

    return null;
  }
}
