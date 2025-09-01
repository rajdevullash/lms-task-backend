// Define your routes here

import express from 'express';
import { ENUM_USER_ROLE } from '../../../enums/user';

import auth from '../../middlewares/auth';
import { CourseController } from './course.controller';
import { configureImagesUpload } from './course.utils';

const router = express.Router();

router.post(
  '/create-course',
  auth(ENUM_USER_ROLE.ADMIN),
  configureImagesUpload(),
  //   validateRequest(ServiceValidation.createServiceZodSchema),

  CourseController.createCourse,
);
