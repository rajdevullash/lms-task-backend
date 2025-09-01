import mongoose, { Model } from 'mongoose';
import { CloudinaryUploadFile } from '../../../interfaces/cloudinaryUpload';
export type ICourse = {
  title: string;
  slug?: string;
  description: string;
  price: number;

  thumbnail: CloudinaryUploadFile[];
  createdBy: mongoose.Types.ObjectId;
};
export type CourseModel = Model<ICourse, Record<string, unknown>>;

export type ICourseFilters = {
  searchTerm?: string;
};
