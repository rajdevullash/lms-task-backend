import mongoose, { Model } from 'mongoose';
export type ICourse = {
  title: string;
  slug?: string;
  description: string;
  price: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  thumbnail: Record<string, any>[] | null;
  createdBy: mongoose.Types.ObjectId;
};
export type CourseModel = Model<ICourse, Record<string, unknown>>;

export type ICourseFilters = {
  searchTerm?: string;
};
