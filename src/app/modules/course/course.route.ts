// // Define your routes here

import express from 'express';
// import multer from 'multer';
import { ENUM_USER_ROLE } from '../../../enums/user';
// import { fileFilter, storage } from '../../../shared/cloudinary';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { CourseController } from './course.controller';
import { configureImagesUpload } from './course.utils';
import { CourseValidation } from './course.validation';

const router = express.Router();

router.get(
  '/get-all',
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.getAllCourses,
);
router.get(
  '/get-all-course-user',
  auth(ENUM_USER_ROLE.USER),
  CourseController.getAllCoursesUser,
);

router.get(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.getSingleCourse,
);
router.get(
  '/user-single-course/:id',
  auth(ENUM_USER_ROLE.USER),
  CourseController.getSingleCourseUser,
);
router.get(
  '/with-progress/:id',
  auth(ENUM_USER_ROLE.USER),
  CourseController.getCourseWithProgress,
);

router.post(
  '/create-course',
  auth(ENUM_USER_ROLE.ADMIN),
  configureImagesUpload(),
  validateRequest(CourseValidation.createCourseZodSchema),
  CourseController.createCourse,
);

router.patch(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  configureImagesUpload(),
  validateRequest(CourseValidation.updateCourseZodSchema),
  CourseController.updateCourse,
);

router.delete(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  CourseController.deleteCourse,
);

export const CourseRoutes = router;
