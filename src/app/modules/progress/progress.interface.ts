// Define your interfaces here

import mongoose, { Model } from 'mongoose';
export type IProgress = {
  userId: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  completedLectures: mongoose.Types.ObjectId[];
  currentLecture: mongoose.Types.ObjectId;
  progressPercentage: number;
  lastAccessed: Date;
};
export type ProgressModel = Model<IProgress, Record<string, unknown>>;

export type IProgressFilters = {
  searchTerm?: string;
};
