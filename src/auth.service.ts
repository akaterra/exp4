import * as jwt from 'jsonwebtoken';
import { User } from './user';

const jwtSecret = process.env.JWT_ACCESS_TOKEN_SECRET ?? 'secret';

export function authorize(accessToken: string): User {
  return jwt.verigy(accessToken, jwtSecret);
}

export function prepareAuthData(user: User) {
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
