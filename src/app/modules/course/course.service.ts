import httpStatus from 'http-status';
import slugify from 'slugify';
import ApiError from '../../../errors/ApiError';
import {
  deleteCloudinaryFiles,
  uploadToCloudinary,
} from '../../../shared/cloudinary';
import { User } from '../auth/auth.model';
import { ICourse } from './course.interface';
import { Course } from './course.model';

// Your service code here
const createCourse = async (
  userId: string,
  payload: ICourse,
): Promise<ICourse | null> => {
  const { title } = payload;
  const baseSlug = slugify(title, { lower: true });

  const imageUrl = await uploadToCloudinary(payload.thumbnail);

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const data = {
    ...payload,
    slug: baseSlug,
    thumbnail: imageUrl,
    createdBy: userId,
  };

  const result = await Course.create(data);

  if (!result) {
    await deleteCloudinaryFiles(payload.thumbnail);
  }
  return result;

  return result;
};

export const CourseService = {
  createCourse,
};
