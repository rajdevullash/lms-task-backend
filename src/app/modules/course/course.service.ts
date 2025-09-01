import httpStatus from 'http-status';
import { SortOrder } from 'mongoose';
import slugify from 'slugify';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import {
  deleteCloudinaryFiles,
  uploadToCloudinary,
} from '../../../shared/cloudinary';
import { User } from '../auth/auth.model';
import { courseFilterableFields } from './course.constant';
import { ICourse, ICourseFilters } from './course.interface';
import { Course } from './course.model';

const createCourse = async (
  userId: string,
  payload: ICourse,
): Promise<ICourse | null> => {
  const { title, thumbnail } = payload;

  // Validate that thumbnail exists
  if (!thumbnail) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Thumbnail is required');
  }

  const baseSlug = slugify(title, { lower: true });

  // Upload single image to Cloudinary (wrap in array and take first result)

  const uploadedImage = await uploadToCloudinary(
    payload.thumbnail as unknown as CloudinaryUploadFile[],
  );

  const findUser = await User.findOne({ _id: userId });

  if (!findUser) {
    // Clean up uploaded image if user not found
    await deleteCloudinaryFiles(
      payload.thumbnail as unknown as CloudinaryUploadFile[],
    );
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const data = {
    ...payload,
    slug: baseSlug,
    thumbnail: uploadedImage, // Store the secure URL
    createdBy: userId,
  };

  try {
    const result = await Course.create(data);
    return result;
  } catch (error) {
    // Clean up uploaded image if course creation fails
    await deleteCloudinaryFiles(
      payload.thumbnail as unknown as CloudinaryUploadFile[],
    );
    throw error;
  }
};

//get all courses
const getAllCourses = async (
  userId: string,
  filters: ICourseFilters,
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<ICourse[]>> => {
  // Extract searchTerm to implement search query
  const { searchTerm, ...filtersData } = filters;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];
  // Search needs $or for searching in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: courseFilterableFields.map(field => ({
        [field]: {
          $regex: searchTerm,
          $options: 'i',
        },
      })),
    });
  }
  // Filters needs $and to fullfill all the conditions
  if (Object.keys(filtersData).length) {
    andConditions.push({
      $and: Object.entries(filtersData).map(([field, value]) => ({
        [field]: value,
      })),
    });
  }

  // Dynamic  Sort needs  field to  do sorting
  const sortConditions: { [key: string]: SortOrder } = {};
  if (sortBy && sortOrder) {
    sortConditions[sortBy] = sortOrder;
  }
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};
  const result = await Course.find(whereConditions)
    .where({ createdBy: userId })
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  const total = await Course.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

//get single course
const getSingleCourse = async (
  userId: string,
  courseId: string,
): Promise<ICourse | null> => {
  const result = await Course.findOne({
    slug: courseId,
    createdBy: userId,
  });
  if (!result) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }
  return result;
};

//update course
const updateCourse = async (
  userId: string,
  id: string,
  payload: Partial<ICourse>,
): Promise<ICourse | null> => {
  const existingCourse = await Course.findOne({ slug: id, createdBy: userId });
  if (!existingCourse) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }

  let baseSlug;

  // Generate the slug if a title is provided
  if (payload.title) {
    baseSlug = slugify(payload.title, { lower: true });
  }

  // console.log(payload);
  // console.log(id);

  // Create the object to be updated with dynamic fields
  const updatedPayload: Partial<ICourse> = { ...payload };

  if (Array.isArray(payload.thumbnail) && payload.thumbnail.length > 0) {
    // Assuming payload.image is an array of records or file objects, process it for Cloudinary upload
    const image = await uploadToCloudinary(
      payload.thumbnail as unknown as CloudinaryUploadFile[],
    );
    updatedPayload.thumbnail = image;
  } else if (
    Array.isArray(payload.thumbnail) &&
    payload.thumbnail.length === 0
  ) {
    // If the image array is empty, remove the image from the update
    const data = await Course.findOne({
      slug: id,
      createdBy: userId,
    });
    if (data?.thumbnail) {
      updatedPayload.thumbnail = data.thumbnail;
    }
  }

  // If a new slug is generated, add it to the payload
  if (baseSlug) {
    updatedPayload.slug = baseSlug;
  }

  // Perform the update in the database
  const result = await Course.findOneAndUpdate({ slug: id }, updatedPayload, {
    new: true,
  });

  return result;
};

//delete course
const deleteCourse = async (
  userId: string,
  courseId: string,
): Promise<ICourse | null> => {
  const existingCourse = await Course.findOne({
    slug: courseId,
    createdBy: userId,
  });
  if (!existingCourse) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Course not found');
  }
  await Course.findOneAndDelete({
    slug: courseId,
    createdBy: userId,
  });
  return null;
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getSingleCourse,
  updateCourse,
  deleteCourse,
};
