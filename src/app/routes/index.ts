import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CourseRoutes } from '../modules/course/course.route';
import { ModuleRoutes } from '../modules/module/module.route';

const router = express.Router();

const moduleRoutes = [
  {
    path: '/auth',
    route: AuthRoutes,
  },
  {
    path: '/course',
    route: CourseRoutes,
  },
  {
    path: '/module',
    route: ModuleRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));
export default router;
