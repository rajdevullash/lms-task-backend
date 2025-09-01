// Define your model here
import { Schema, model } from 'mongoose';
import { IProgress, ProgressModel } from './progress.interface';

const ProgressSchema = new Schema<IProgress, ProgressModel>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    completedLectures: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lecture',
      },
    ],
    currentLecture: {
      type: Schema.Types.ObjectId,
      ref: 'Lecture',
      required: true,
    },
    progressPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
      default: 0,
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

export const Progress = model<IProgress, ProgressModel>(
  'Progress',
  ProgressSchema,
);
