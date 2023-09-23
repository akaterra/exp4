import * as jwt from 'jsonwebtoken';
import { IUser } from './user';
import { v4 } from 'uuid';
import {AwaitedCache} from './cache';

const jwtSecret = process.env.JWT_ACCESS_TOKEN_SECRET ?? 'secret';

export function authorize(accessToken: string): IUser {
  try {
    return jwt.verify(accessToken, jwtSecret);
  } catch (err) {
    throw new Error('Unauthorized');
  }
}

export function prepareAuthData(user: IUser) {
  const tokenPayload = {
    id: user.id,
    name: user.name,
  };
  const accessToken = jwt.sign(tokenPayload, jwtSecret);

  return {
    accessToken,
    user,
  };
}

const OTT_DATA = new AwaitedCache<IUser>().runAutoInvalidate();

export function generateOneTimeToken(user: IUser) {
  const id = v4();

  OTT_DATA.set(id, user, 600);

  return id;
}

export function authorizeByOneTimeToken(id: string): IUser {
  return OTT_DATA.get(id) as IUser;
}
