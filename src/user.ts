export interface IUser extends Record<string, unknown> {
  id: string;
  type: string;

  email?: string;
  name?: string;
  phoneNumber?: string;
  status?;
}
