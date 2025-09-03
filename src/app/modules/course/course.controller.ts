import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paginationFields } from '../../../constants/pagination';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { courseFilterableFields } from './course.constant';
import { ICourse } from './course.interface';
import { CourseService } from './course.service';

const createCourse = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const thumbnail = ((
    req as Request & { files: { thumbnail?: CloudinaryUploadFile[] } }
  ).files?.thumbnail || []) as CloudinaryUploadFile[];
  const data = {
    ...req.body,
    thumbnail,
  };

  const result = await CourseService.createCourse(userId, data);

  sendResponse<ICourse>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

//get all course

const getAllCourses = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, courseFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const userId = req.user?.userId;
  const result = await CourseService.getAllCourses(
    userId,
    filters,
    paginationOptions,
  );

  sendResponse<ICourse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Courses fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});
const getAllCoursesUser = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, courseFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);
  const userId = req.user?.userId;
  const result = await CourseService.getAllCoursesUser(
    userId,
    filters,
    paginationOptions,
  );

  sendResponse<ICourse[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Courses fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

//get course by id

const getSingleCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const result = await CourseService.getSingleCourse(userId, id);
  sendResponse<ICourse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Single Course fetched successfully',
    data: result,
  });
});
//get course by id user

const getSingleCourseUser = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const result = await CourseService.getSingleCourseUser(userId, id);
  sendResponse<ICourse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Single Course fetched successfully',
    data: result,
  });
});

//update course

const updateCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  let data = req.body;
  //if file
  if (req.files) {
    data = {
      ...req.body,
      thumbnail: ((
        req as Request & { files: { thumbnail?: CloudinaryUploadFile[] } }
      ).files?.thumbnail || []) as CloudinaryUploadFile[],
    };
  } else {
    data = {
      ...req.body,
    };
  }
  const result = await CourseService.updateCourse(userId, id, data);
  sendResponse<ICourse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course updated successfully',
    data: result,
  });
});

//delete course

const deleteCourse = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  await CourseService.deleteCourse(userId, id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course deleted successfully',
  });
});

const getCourseWithProgress = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id as string | undefined;

    const result = await CourseService.getCourseWithProgress(id, userId);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Course with progress fetched successfully',
      data: result,
    });
  },
);

export const CourseController = {
  createCourse,
  getAllCourses,
  getAllCoursesUser,
  getSingleCourse,
  getSingleCourseUser,
  getCourseWithProgress,
  updateCourse,
  deleteCourse,
};
