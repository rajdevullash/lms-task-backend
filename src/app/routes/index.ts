import express from 'express';
import { AuthRoutes } from '../modules/auth/auth.route';
import { CourseRoutes } from '../modules/course/course.route';
import { LectureRoutes } from '../modules/lecture/lecture.route';
import { ModuleRoutes } from '../modules/module/module.route';
import { ProgressRoutes } from '../modules/progress/progress.route';

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
  {
    path: '/lecture',
    route: LectureRoutes,
  },
  {
    path: '/progress',
    route: ProgressRoutes,
  },
];

moduleRoutes.forEach(route => router.use(route.path, route.route));
export default router;
