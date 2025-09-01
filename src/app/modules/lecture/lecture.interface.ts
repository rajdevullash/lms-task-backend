// Define your interfaces here
/* eslint-disable @typescript-eslint/no-explicit-any */
// Define your model here
import mongoose, { Model } from 'mongoose';
export type ILecture = {
  title: string;
  slug?: string;
  videoUrl: string;
  pdfNotes: Record<string, any>[] | null;
  moduleId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  order: number;
  createdAt?: Date;
};
export type LectureModel = Model<ILecture, Record<string, unknown>>;

export type ILectureFilters = {
  searchTerm?: string;
};
