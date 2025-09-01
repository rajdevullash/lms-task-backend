// Define your routes here
// // Define your routes here

import express from 'express';
// import multer from 'multer';
import { ENUM_USER_ROLE } from '../../../enums/user';
// import { fileFilter, storage } from '../../../shared/cloudinary';
import auth from '../../middlewares/auth';
import validateRequest from '../../middlewares/validateRequest';
import { ModuleController } from './module.controller';
import { ModuleValidation } from './module.validation';

const router = express.Router();

router.get(
  '/get-all/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  ModuleController.getAllModules,
);

router.post(
  '/create-module',
  auth(ENUM_USER_ROLE.ADMIN),
  validateRequest(ModuleValidation.createModuleZodSchema),
  ModuleController.createModule,
);

router.patch(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  validateRequest(ModuleValidation.updateModuleZodSchema),
  ModuleController.updateModule,
);

router.delete(
  '/:id',
  auth(ENUM_USER_ROLE.ADMIN),
  ModuleController.deleteModule,
);

export const ModuleRoutes = router;
