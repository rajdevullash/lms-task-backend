import { Schema, model } from 'mongoose';
import { ILecture, LectureModel } from './lecture.interface';

const LectureSchema = new Schema<ILecture, LectureModel>(
  {
    title: {
      type: String,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    videoUrl: {
      type: String,
      required: true,
    },
    pdfNotes: {
      type: [Schema.Types.Mixed],
      default: [],
    },
    moduleId: {
      type: Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    order: {
      type: Number,
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

export const Lecture = model<ILecture, LectureModel>('Lecture', LectureSchema);
