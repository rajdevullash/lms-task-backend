import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { paginationFields } from '../../../constants/pagination';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
import catchAsync from '../../../shared/catchAsync';
import pick from '../../../shared/pick';
import sendResponse from '../../../shared/sendResponse';
import { lectureFilterableFields } from './lecture.constant';
import { ILecture } from './lecture.interface';
import { LectureService } from './lecture.service';

// Your controller code here
const createLecture = catchAsync(async (req: Request, res: Response) => {
  const pdfNotes = ((
    req as Request & { files: { pdfNotes?: CloudinaryUploadFile[] } }
  ).files?.pdfNotes || []) as CloudinaryUploadFile[];
  const data = {
    ...req.body,
    pdfNotes,
  };

  const result = await LectureService.createLecture(data);

  sendResponse<ILecture>(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Lecture created successfully',
    data: result,
  });
});

//get all lecture

const getAllLectures = catchAsync(async (req: Request, res: Response) => {
  const filters = pick(req.query, lectureFilterableFields);
  const paginationOptions = pick(req.query, paginationFields);

  const result = await LectureService.getAllLectures(
    req.query,
    filters,
    paginationOptions,
  );

  sendResponse<ILecture[]>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lectures fetched successfully',
    meta: result.meta,
    data: result.data,
  });
});

//get lecture by id

const getSingleLecture = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.userId;
  const result = await LectureService.getSingleLecture(id, userId);
  sendResponse<ILecture>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Single Lecture fetched successfully',
    data: result,
  });
});

const getLecturesWithAccess = catchAsync(
  async (req: Request, res: Response) => {
    const { courseId, moduleId } = req.query;
    const userId = req.user?.userId;

    const result = await LectureService.getLecturesWithAccess(
      userId,
      courseId as string,
      moduleId as string,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sendResponse<any[]>(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Lectures fetched successfully',
      data: result,
    });
  },
);

//update lecture

const updateLecture = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  let data = req.body;
  //if file
  if (req.files) {
    data = {
      ...req.body,
      pdfNotes: ((
        req as Request & { files: { pdfNotes?: CloudinaryUploadFile[] } }
      ).files?.pdfNotes || []) as CloudinaryUploadFile[],
    };
  } else {
    data = {
      ...req.body,
    };
  }
  const result = await LectureService.updateLecture(id, data);
  sendResponse<ILecture>(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture updated successfully',
    data: result,
  });
});

//delete lecture

const deleteLecture = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  await LectureService.deleteLecture(id);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Lecture deleted successfully',
  });
});

export const LectureController = {
  createLecture,
  getAllLectures,
  getSingleLecture,
  getLecturesWithAccess,
  updateLecture,
  deleteLecture,
};
