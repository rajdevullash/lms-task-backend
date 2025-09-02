// Define your routes here
// Define your routes here
// // Define your routes here

import express from 'express';
// import multer from 'multer';
import { ENUM_USER_ROLE } from '../../../enums/user';
// import { fileFilter, storage } from '../../../shared/cloudinary';
import auth from '../../middlewares/auth';
import { ProgressController } from './progress.controller';

const router = express.Router();

router.get(
  '/check-lecture-access/:courseId/:lectureId',
  auth(ENUM_USER_ROLE.USER),
  ProgressController.checkLectureAccess,
);
router.get(
  '/get-course/:courseId',
  auth(ENUM_USER_ROLE.USER),
  ProgressController.getCourseProgress,
);
router.get(
  '/get-user-progress',
  auth(ENUM_USER_ROLE.USER),
  ProgressController.getUserProgress,
);

router.post(
  '/lecture-completed',
  auth(ENUM_USER_ROLE.USER),
  ProgressController.markLectureComplete,
);

router.patch(
  '/current-lecture',
  auth(ENUM_USER_ROLE.USER),
  ProgressController.updateCurrentLecture,
);

export const ModuleRoutes = router;
