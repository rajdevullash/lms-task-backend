// Define your interfaces here
import mongoose, { Model } from 'mongoose';
export type IModule = {
  title: string;
  slug?: string;
  moduleNumber: number;
  courseId: mongoose.Types.ObjectId;
};
export type ModuleModel = Model<IModule, Record<string, unknown>>;

export type IModuleFilters = {
  searchTerm?: string;
};
