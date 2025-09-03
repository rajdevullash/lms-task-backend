import httpStatus from 'http-status';
import { SortOrder } from 'mongoose';
import slugify from 'slugify';
import ApiError from '../../../errors/ApiError';
import { paginationHelpers } from '../../../helpers/paginationHelper';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
import { IGenericResponse } from '../../../interfaces/common';
import { IPaginationOptions } from '../../../interfaces/pagination';
import { checkLectureAccessHelper } from '../../../shared/checkLectureAccessHelper ';
import {
  deleteCloudinaryPdfs,
  uploadPdfsToCloudinary,
} from '../../../shared/cloudinary';
import { Course } from '../course/course.model';
import { Module } from '../module/module.model';
import { Progress } from '../progress/progress.model';
import { lectureFilterableFields } from './lecture.constant';
import { ILecture, ILectureFilters } from './lecture.interface';
import { Lecture } from './lecture.model';

// Your service code here
const createLecture = async (payload: ILecture): Promise<ILecture | null> => {
  const { title, pdfNotes, moduleId, courseId } = payload;

  //check moduleId and courseId
  if (!moduleId || !courseId) {
    throw new ApiError(
      httpStatus.BAD_REQUEST,
      'Module ID and Course ID are required',
    );
  }

  //check moduleId and courseId exist on db
  const moduleExists = await Module.exists({ _id: moduleId });
  const courseExists = await Course.exists({ _id: courseId });

  if (!moduleExists || !courseExists) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Module or Course not found');
  }

  // Get the next order number
  const lectureCount = await Lecture.countDocuments({ moduleId });
  const order = lectureCount + 1;

  // Validate that pdfNotes exists
  if (!pdfNotes || pdfNotes.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'PDF notes are required');
  }

  const baseSlug = slugify(title, { lower: true });

  // Upload single image to Cloudinary (wrap in array and take first result)

  const uploadedPdf = await uploadPdfsToCloudinary(
    payload.pdfNotes as unknown as CloudinaryUploadFile[],
  );

  const data = {
    ...payload,
    slug: baseSlug,
    pdfNotes: uploadedPdf,
    orderNumber: order,
  };

  try {
    const result = await Lecture.create(data);
    return result;
  } catch (error) {
    // Clean up uploaded pdf if lecture creation fails
    await deleteCloudinaryPdfs(
      payload.pdfNotes as unknown as CloudinaryUploadFile[],
    );
    throw error;
  }
};

const getAllLectures = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  filters: ILectureFilters,
  paginationOptions: IPaginationOptions,
): Promise<IGenericResponse<ILecture[]>> => {
  // Extract searchTerm to implement search query
  const { searchTerm, ...filtersData } = filters;

  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelpers.calculatePagination(paginationOptions);

  const andConditions = [];
  // Search needs $or for searching in specified fields
  if (searchTerm) {
    andConditions.push({
      $or: lectureFilterableFields.map(field => ({
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

  const { courseId, moduleId } = query;
  const whereConditions =
    andConditions.length > 0 ? { $and: andConditions } : {};
  const result = await Lecture.find(whereConditions)
    .where({ courseId: courseId, moduleId: moduleId })
    .populate('moduleId', 'title moduleNumber')
    .sort({ order: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Lecture.countDocuments(whereConditions);

  return {
    meta: {
      page,
      limit,
      total,
    },
    data: result,
  };
};

//get single lecture
const getSingleLecture = async (
  lectureId: string,
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> => {
  const lecture = await Lecture.findOne({ slug: lectureId })
    .populate('moduleId', 'title moduleNumber')
    .populate('courseId', 'title');

  if (!lecture) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  if (!userId) {
    // Unauthenticated users get locked lecture
    return {
      ...lecture.toObject(),
      isLocked: true,
      videoUrl: null,
      pdfNotes: [],
    };
  }

  // Check access for authenticated user
  const accessCheck = await checkLectureAccessHelper(
    lecture.courseId,
    userId,
    lecture._id,
  );

  if (!accessCheck.canAccess) {
    return {
      lecture: {
        _id: lecture._id,
        title: lecture.title,
        videoUrl: lecture.videoUrl,
        pdfNotes: lecture.pdfNotes,
        moduleId: lecture.moduleId,
        courseId: lecture.courseId,
        order: lecture.order,
        isLocked: true,
      },
      reason: accessCheck.reason,
    };
  }

  // Add progress info
  const progress = await Progress.findOne({
    userId,
    courseId: lecture.courseId,
  });

  return {
    ...lecture.toObject(),
    isLocked: false,
    isCompleted:
      progress?.completedLectures.some(
        id => id.toString() === lecture._id.toString(),
      ) || false,
    isCurrent: progress?.currentLecture?.toString() === lecture._id.toString(),
  };
};

const getLecturesWithAccess = async (
  userId?: string,
  courseId?: string,
  moduleId?: string,
) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {};
  if (courseId) filter.courseId = courseId;
  if (moduleId) filter.moduleId = moduleId;

  const lectures = await Lecture.find(filter)
    .populate('moduleId', 'title moduleNumber')
    .sort({ order: 1 });

  if (!userId) {
    // Return all lectures as locked for unauthenticated users
    return lectures.map(lecture => ({
      _id: lecture._id,
      title: lecture.title,
      moduleId: lecture.moduleId,
      courseId: lecture.courseId,
      order: lecture.order,
      isLocked: true,
      isCompleted: false,
      isCurrent: false,
    }));
  }

  // Get user's progress
  const progress = await Progress.findOne({
    userId,
    courseId: courseId || lectures[0]?.courseId,
  });

  // Add access info for each lecture
  const lecturesWithAccess = await Promise.all(
    lectures.map(async lecture => {
      const accessCheck = await checkLectureAccessHelper(
        lecture.courseId,
        userId,
        lecture._id,
      );

      return {
        _id: lecture._id,
        title: lecture.title,
        moduleId: lecture.moduleId,
        courseId: lecture.courseId,
        order: lecture.order,
        videoUrl: accessCheck.canAccess ? lecture.videoUrl : null,
        pdfNotes: accessCheck.canAccess ? lecture.pdfNotes : [],
        createdAt: lecture.createdAt,
        isLocked: !accessCheck.canAccess,
        isCompleted:
          progress?.completedLectures.some(
            id => id.toString() === lecture._id.toString(),
          ) || false,
        isCurrent:
          progress?.currentLecture?.toString() === lecture._id.toString(),
        lockReason: accessCheck.reason,
      };
    }),
  );

  return lecturesWithAccess;
};

//update lecture
const updateLecture = async (
  id: string,
  payload: Partial<ILecture>,
): Promise<ILecture | null> => {
  const existingLecture = await Lecture.findOne({ slug: id });
  if (!existingLecture) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  let baseSlug;

  // Generate the slug if a title is provided
  if (payload.title) {
    baseSlug = slugify(payload.title, { lower: true });
  }

  // console.log(payload);
  // console.log(id);

  // Create the object to be updated with dynamic fields
  const updatedPayload: Partial<ILecture> = { ...payload };

  if (Array.isArray(payload.pdfNotes) && payload.pdfNotes.length > 0) {
    // Assuming payload.image is an array of records or file objects, process it for Cloudinary upload
    const image = await uploadPdfsToCloudinary(
      payload.pdfNotes as unknown as CloudinaryUploadFile[],
    );
    updatedPayload.pdfNotes = image;
  } else if (Array.isArray(payload.pdfNotes) && payload.pdfNotes.length === 0) {
    // If the image array is empty, remove the image from the update
    const data = await Lecture.findOne({
      slug: id,
    });
    if (data?.pdfNotes) {
      updatedPayload.pdfNotes = data.pdfNotes;
    }
  }

  // If a new slug is generated, add it to the payload
  if (baseSlug) {
    updatedPayload.slug = baseSlug;
  }

  // Perform the update in the database
  const result = await Lecture.findOneAndUpdate({ slug: id }, updatedPayload, {
    new: true,
  });

  return result;
};

//delete lecture
const deleteLecture = async (lectureId: string): Promise<ILecture | null> => {
  const existingLecture = await Lecture.findOne({
    slug: lectureId,
  });
  if (!existingLecture) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lecture not found');
  }
  await Lecture.findOneAndDelete({
    slug: lectureId,
  });
  return null;
};

export const LectureService = {
  createLecture,
  getAllLectures,
  getSingleLecture,
  getLecturesWithAccess,
  deleteLecture,
  updateLecture,
};
