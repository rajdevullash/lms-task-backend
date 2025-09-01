// Define your routes here
// // Define your routes here

import express from 'express';
// import multer from 'multer';
import { ENUM_USER_ROLE } from '../../../enums/user';
// import { fileFilter, storage } from '../../../shared/cloudinary';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { LectureController } from './lecture.controller';
import { configurePdfUpload } from './lecture.utils';
import { LectureValidation } from './lecture.validation';

const router = express.Router();

router.get(
  '/get-all',
  auth(ENUM_USER_ROLE.ADMIN),
  LectureController.getAllLectures,
);

router.get(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  LectureController.getSingleLecture,
);

router.post(
  '/create-lecture',
  auth(ENUM_USER_ROLE.ADMIN),
  configurePdfUpload(),
  validateRequest(LectureValidation.createLectureZodSchema),
  LectureController.createLecture,
);

router.patch(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  configurePdfUpload(),
  validateRequest(LectureValidation.updateLectureZodSchema),
  LectureController.updateLecture,
);

router.delete(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  LectureController.deleteLecture,
);

export const LectureRoutes = router;
