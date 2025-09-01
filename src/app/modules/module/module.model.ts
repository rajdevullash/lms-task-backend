// Define your model here
import { Schema, model } from 'mongoose';
import { IModule, ModuleModel } from './module.interface';

const ModuleSchema = new Schema<IModule, ModuleModel>(
  {
    title: {
      type: String,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    moduleNumber: {
      type: Number,
      unique: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const Module = model<IModule, ModuleModel>('Module', ModuleSchema);
