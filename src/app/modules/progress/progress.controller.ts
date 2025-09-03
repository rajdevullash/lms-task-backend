import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { ProgressService } from './progress.service';

// Your controller code here
const getCourseProgress = catchAsync(async (req: Request, res: Response) => {
  const { courseId } = req.params;
  const userId = req.user?.userId as string;
  const result = await ProgressService.getCourseProgress(courseId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Course progress fetched successfully',
    data: result,
  });
});

const getUserProgress = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.userId as string;

  const result = await ProgressService.getUserProgress(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User progress fetched successfully',
    data: result,
  });
});

const markLectureComplete = catchAsync(async (req: Request, res: Response) => {
  const { courseId, lectureId } = req.body;

  console.log(courseId, lectureId);
  const userId = req.user?.userId as string;

  const result = await ProgressService.markLectureComplete(
    courseId,
    lectureId,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture marked as complete',
    data: result,
  });
});

const updateCurrentLecture = catchAsync(async (req: Request, res: Response) => {
  const { courseId, lectureId } = req.body;
  const userId = req.user?.userId as string;

  const progress = await ProgressService.updateCurrentLecture(
    courseId,
    lectureId,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Current lecture updated successfully',
    data: progress,
  });
});

const checkLectureAccess = catchAsync(async (req: Request, res: Response) => {
  const { courseId, lectureId } = req.params;
  const userId = req.user?.userId as string;

  if (!userId) {
    return res.status(httpStatus.UNAUTHORIZED).json({
      success: false,
      message: 'User not authenticated',
    });
  }

  const accessInfo = await ProgressService.checkLectureAccess(
    courseId,
    lectureId,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture access checked successfully',
    data: accessInfo,
  });
});

export const ProgressController = {
  getCourseProgress,
  getUserProgress,
  markLectureComplete,
  updateCurrentLecture,
  checkLectureAccess,
};
