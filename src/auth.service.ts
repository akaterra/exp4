import * as jwt from 'jsonwebtoken';
import { IUser } from './user';

const jwtSecret = process.env.JWT_ACCESS_TOKEN_SECRET ?? 'secret';

export function authorize(accessToken: string): IUser {
  return jwt.verigy(accessToken, jwtSecret);
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
