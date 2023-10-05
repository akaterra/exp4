import { rest } from './rest-api.service';
import { URL } from 'url';

export class JenkinsService {
  protected hostUrl: URL;

  constructor(
    private host: string = process.env.JENKINS_HOST,
    private username: string = process.env.JENKINS_USERNAME,
    private password: string = process.env.JENKINS_PASSWORD,
    private token: string = process.env.JENKINS_TOKEN,
  ) {
    this.hostUrl = new URL(host);
  }

  async getJobHistory(name: string): Promise<any[]> {
    const runs = await rest.doRequest(
      this.getUrl(`/job/${name}/api/json?tree=allBuilds[id,timestamp,result,duration]`),
      'get',
    );

    if (runs) {
      let promises = [];

      for (const run of runs) {
        promises.push(rest.doRequest(
          this.getUrl(`/job/${name}/${run.id}/api/json`),
          'get',
        ).then((res) => run.details = res));

        if (promises.length >= 10) {
          await Promise.all(promises);
          promises = [];
        }
      }

      await Promise.all(promises);

      return runs;
    }

    return [];
  }

  async runJob(name: string, params?: Record<string, unknown>) {
    await rest.doRequest(
      params
        ? this.getUrl(`/job/${name}/api/buildWithParameters`)
        : this.getUrl(`/job/${name}/api/build/api/json`),
      'post',
      undefined,
      params,
    );
  }

  private getUrl(path: string): string {
    if (this.username && this.token) {
      return `${this.hostUrl.protocol}//${encodeURIComponent(this.username)}:${this.token}@${this.hostUrl.host}:${this.hostUrl.port}${path}`;
    }

    if (this.username && this.password) {
      return `${this.hostUrl.protocol}//${encodeURIComponent(this.username)}:${encodeURIComponent(this.password)}@${this.hostUrl.host}:${this.hostUrl.port}${path}`;
    }

    return `${this.host}${path}`;
  }
}
