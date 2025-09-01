import { ENUM_USER_ROLE } from '../../../enums/user';

export type IUser = {
  name: string;
  email: string;
  password: string;
  role?: ENUM_USER_ROLE;
};

export type IUserLogin = {
  email: string;
  password: string;
};

export type IUserLoginResponse = {
  user: {
    email: string;
    role: ENUM_USER_ROLE;
    name: string;
  };
  accessToken: string;
  refreshToken?: string;
};

export type IRefreshTokenResponse = {
  accessToken: string;
};

export type ITokenPayload = {
  userId: string;
  role: ENUM_USER_ROLE;
};
