import { computed, flow, makeObservable, observable } from 'mobx';
import { UserDto } from './dto/user.dto';

export class RootStore {
  @observable
  isAuthorized: boolean = false;
  @observable
  user: UserDto | null = null;

  accessToken: string | null = null;

  constructor() {
    makeObservable(this);

    this.fetch();
  }

  @flow
  *fetch() {
    this.accessToken = localStorage.getItem('accessToken');

    if (this.accessToken) {
      this.isAuthorized = true;
    } else {
      this.isAuthorized = false;
    }
  }
}

export const rootStore = new RootStore();
