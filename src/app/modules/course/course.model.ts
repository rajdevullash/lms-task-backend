import { Schema, model } from 'mongoose';
import { CourseModel, ICourse } from './course.interface';

const CourseSchema = new Schema<ICourse, CourseModel>(
  {
    title: {
      type: String,
      unique: true,
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
    },
    thumbnail: {
      type: [Object],
      required: true,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

export const Course = model<ICourse, CourseModel>('Course', CourseSchema);
