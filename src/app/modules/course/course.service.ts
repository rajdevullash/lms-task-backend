import httpStatus from 'http-status';
import { Document, SortOrder, Types } from 'mongoose';
import slugify from 'slugify';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { checkLectureAccessHelper } from '../../../shared/checkLectureAccessHelper ';
import {
  deleteCloudinaryFiles,
  uploadToCloudinary,
} from '../../../shared/cloudinary';
import { User } from '../auth/auth.model';
import { Lecture } from '../lecture/lecture.model';
import { Module } from '../module/module.model';
import { IProgress } from '../progress/progress.interface';
import { Progress } from '../progress/progress.model';
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

const getCourseWithProgress = async (courseId: string, userId?: string) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new Error('Course not found');
  }

  const modules = await Module.find({ courseId: course._id }).sort({
    moduleNumber: 1,
  });

  const lectures = await Lecture.find({ courseId: course._id })
    .populate('moduleId')
    .sort({ order: 1 });

  let progress:
    | (Document<unknown, Record<string, unknown>, IProgress> &
        IProgress & { _id: Types.ObjectId })
    | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lecturesWithAccess: any[] = lectures;

  if (userId) {
    progress = await Progress.findOne({ userId, courseId: course._id });

    lecturesWithAccess = await Promise.all(
      lectures.map(async lecture => {
        const accessInfo = await checkLectureAccessHelper(
          course._id,
          userId,
          lecture._id,
          lectures,
        );

        return {
          ...lecture.toObject(),
          isLocked: !accessInfo.canAccess,
          isCompleted:
            progress?.completedLectures.includes(lecture._id) || false,
          isCurrent:
            progress?.currentLecture?.toString() === lecture._id.toString(),
          lockReason: accessInfo.reason,
        };
      }),
    );
  } else {
    // Guest users
    lecturesWithAccess = lectures.map(lecture => ({
      ...lecture.toObject(),
      isLocked: true,
      isCompleted: false,
      isCurrent: false,
      videoUrl: null,
      pdfNotes: [],
    }));
  }

  return {
    course,
    modules,
    lectures: lecturesWithAccess,
    progress: progress
      ? {
          totalLectures: lectures.length,
          completedLectures: progress.completedLectures.length,
          progressPercentage: progress.progressPercentage,
          currentLecture: progress.currentLecture,
          lastAccessed: progress.lastAccessed,
        }
      : null,
  };
};

export const CourseService = {
  createCourse,
  getAllCourses,
  getSingleCourse,
  getCourseWithProgress,
  updateCourse,
  deleteCourse,
};
