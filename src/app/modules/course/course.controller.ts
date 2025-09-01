import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ICourse } from './course.interface';
import { CourseService } from './course.service';

// Your controller code here
const createCourse = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?._id;

  const data = {
    ...req.body,
    thumbnail: req.files as CloudinaryUploadFile[], // Assuming req.files is of type File[] or undefined
  };
  const result = await CourseService.createCourse(userId, data);

  sendResponse<ICourse>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course created successfully',
    data: result,
  });
});

export const CourseController = {
  createCourse,
};
