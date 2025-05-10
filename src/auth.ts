import * as jwt from 'jsonwebtoken';
import { IUser } from './user';
import { v4 } from 'uuid';
import { AwaitedCache } from './cache';
import { AUTH_DOMAIN, AUTH_MODE, JWT_SECRET } from './const';

export function authorize(accessToken: string): IUser {
  try {
    return jwt.verify(accessToken, JWT_SECRET);
  } catch (err) {
    throw new Error('Unauthorized');
  }
}

export function prepareAuthData(user: IUser) {
  const tokenPayload = {
    id: user.id,
    name: user.name,
  };
  const accessToken = jwt.sign(tokenPayload, JWT_SECRET);

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

export function authSendData(req, res, data) {
  switch (AUTH_MODE) {
  case 'cookie':
    for (const domain of (AUTH_DOMAIN ?? '').split(',')) {
      res.cookie('authorization', data.accessToken, { domain: domain || null, httpOnly: true, sameSite: 'none', secure: true });
    }

    res.json({ accessToken: 'null', user: data.user });
    break;
  default:
    res.json(data);
    break;
  }
}

export function authLogout(req, res) {
  switch (AUTH_MODE) {
  case 'cookie':
    for (const domain of (AUTH_DOMAIN ?? '').split(',')) {
      res.clearCookie('authorization', { domain: domain || null, sameSite: 'none', secure: true });
    }

    break;
  }

  res.json(true);
}
