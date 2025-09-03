// Your service code here
import httpStatus from 'http-status';
import mongoose, { SortOrder } from 'mongoose';
import slugify from 'slugify';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { Course } from '../course/course.model';
import { moduleFilterableFields } from './module.constant';
import { IModule, IModuleFilters } from './module.interface';
import { Module } from './module.model';

const createModule = async (payload: IModule): Promise<IModule | null> => {
  const { title, courseId } = payload;

  // Get the next module number
  const moduleCount = await Module.countDocuments({ courseId });
  const moduleNumber = moduleCount + 1;

  const baseSlug = slugify(title, { lower: true });

  const data = {
    ...payload,
    slug: baseSlug,
    moduleNumber: moduleNumber,
  };

  const result = await Module.create(data);
  return result;
};

//get all courses
const getAllModules = async (
  filters: IModuleFilters,
  paginationOptions: IPaginationOptions,
  courseId: string,
): Promise<IGenericResponse<IModule[]>> => {
  // Extract searchTerm to implement search query
  const { searchTerm, ...filtersData } = filters;

  console.log(typeof courseId);

  let updateCourseId = courseId;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];
  // Search needs $or for searching in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: moduleFilterableFields.map(field => ({
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

  if (
    courseId === String(courseId) &&
    mongoose.isValidObjectId(courseId) == false
  ) {
    const course = await Course.findOne({ slug: courseId });
    if (!course) {
      throw new Error('Course not found');
    }

    updateCourseId = course?._id.toString();
  }

  console.log(updateCourseId);

  const result = await Module.find(whereConditions)
    .where({ courseId: updateCourseId })
    .sort(sortConditions)
    .skip(skip)
    .limit(limit);

  console.log(result);

  const total = await Module.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

const updateModule = async (
  id: string,
  payload: Partial<IModule>,
): Promise<IModule | null> => {
  const existingModule = await Module.findOne({ slug: id });
  if (!existingModule) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Module not found');
  }

  let baseSlug;

  // Generate the slug if a title is provided
  if (payload.title) {
    baseSlug = slugify(payload.title, { lower: true });
  }

  // console.log(payload);
  // console.log(id);

  // Create the object to be updated with dynamic fields
  const updatedPayload: Partial<IModule> = { ...payload };

  // If a new slug is generated, add it to the payload
  if (baseSlug) {
    updatedPayload.slug = baseSlug;
  }

  // Perform the update in the database
  const result = await Module.findOneAndUpdate({ slug: id }, updatedPayload, {
    new: true,
  });

  return result;
};

//delete module
const deleteModule = async (id: string): Promise<IModule | null> => {
  const existingModule = await Module.findOne({
    slug: id,
  });
  if (!existingModule) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Module not found');
  }
  await Module.findOneAndDelete({
    slug: id,
  });
  return null;
};

export const ModuleService = {
  createModule,
  getAllModules,
  updateModule,
  deleteModule,
};
