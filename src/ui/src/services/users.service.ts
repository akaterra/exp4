import { IAuthStrategyMethod } from '../stores/dto/auth';
import { IUser } from '../stores/dto/user';
import { RestApiService } from './rest-api.service';

export class UsersService {
  protected rest = new RestApiService();

  authorize(id: string, code: string): Promise<{ accessToken: string, user: IUser }> {
    return this.rest.get(`auth/methods/${id}/callback`, { code });
  }

  authorizeByData(id: string, data: Record<string, unknown>, method: 'get' | 'post' = 'get'): Promise<{ accessToken: string, user: IUser }> {
    return this.rest.doRequest(
      `auth/methods/${id}/callback`,
      method,
      method === 'get' ? undefined : data,
      method === 'get' ? data : undefined,
    );
  }

  getCurrent(): Promise<IUser> {
    return this.rest.get(`auth/users/current`);
  }

  listAuthMethods(): Promise<Record<string, IAuthStrategyMethod>> {
    return this.rest.get('auth/methods');
  }

  listAuthMethodActions(id: string): Promise<IAuthStrategyMethod> {
    return this.rest.get(`auth/methods/${id}`)
  }

  logout() {
    return this.rest.post(`auth/logout`);
  }
}
