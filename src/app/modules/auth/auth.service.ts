import bcrypt from 'bcrypt';
import httpStatus from 'http-status';
import { Secret } from 'jsonwebtoken';
import config from '../../../config';
import { ENUM_USER_ROLE } from '../../../enums/user';
import ApiError from '../../../errors/ApiError';
import { jwtHelpers } from '../../../helpers/jwtHelpers';
import {
  ITokenPayload,
  IUser,
  IUserLogin,
  IUserLoginResponse,
} from './auth.interface';
import { User } from './auth.model';

const createUser = async (user: IUser): Promise<Omit<IUser, 'password'>> => {
  // Check if email already exists
  const existingUser = await User.findOne({ email: user.email });
  if (existingUser) {
    throw new ApiError(httpStatus.CONFLICT, 'Email already exists');
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(
    user.password,
    Number(config.bycrypt_salt_rounds),
  );

  // Create user with hashed password and FORCE role to be CUSTOMER
  const createdUser = await User.create({
    ...user,
    password: hashedPassword,
  });

  // Fetch the user again without the password field
  // const userWithoutPassword = await User.findById(createdUser._id)
  //   .select('-password')
  //   .lean();

  // if (!userWithoutPassword) {
  //   throw new ApiError(
  //     httpStatus.INTERNAL_SERVER_ERROR,
  //     'User creation failed',
  //   );
  // }

  // return userWithoutPassword;

  return createdUser;
};

const loginUser = async (payload: IUserLogin): Promise<IUserLoginResponse> => {
  const { email, password } = payload;
  console.log('service data', payload);

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User does not exist');
  }

  // Directly compare passwords using bcrypt
  const isPasswordMatched = await bcrypt.compare(password, user.password);
  if (!isPasswordMatched) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect password');
  }

  // const { _id: userId, role } = user;
  // const accessToken = jwtHelpers.createToken(
  //   { userId, role },
  //   config.jwt.secret as string,
  //   config.jwt.expires_in as string
  // );
  const tokenPayload: ITokenPayload = {
    userId: user._id.toString(),
    role: user.role as ENUM_USER_ROLE,
  };

  const accessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret as Secret,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.jwt.expires_in as any,
  );

  const refreshToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.refresh_secret as Secret,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.jwt.refresh_expires_in as any,
  );

  return {
    user: {
      email: user.email,
      role: user.role as ENUM_USER_ROLE,
      name: user.name,
    },
    accessToken,
    refreshToken,
  };
};

const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const decoded = jwtHelpers.verifyToken(
    refreshToken,
    config.jwt.refresh_secret as string,
  );

  const user = await User.findById(decoded.userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const tokenPayload: ITokenPayload = {
    userId: user._id.toString(),
    role: user.role as ENUM_USER_ROLE,
  };

  const newAccessToken = jwtHelpers.createToken(
    tokenPayload,
    config.jwt.secret as Secret,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    config.jwt.expires_in as any,
  );

  return newAccessToken;
};

const logoutUser = async (): Promise<void> => {
  // In a stateless JWT system, logout is handled client-side by token deletion
  // If using refresh tokens, you might want to implement a token blacklist here
};

export const AuthService = {
  createUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
};
