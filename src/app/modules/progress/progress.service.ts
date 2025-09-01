import httpStatus from 'http-status';
import { Types } from 'mongoose';
import ApiError from '../../../errors/ApiError';
import { Lecture } from '../lecture/lecture.model';
import { Progress } from './progress.model';

// Your service code here
const getCourseProgress = async (courseId: string, userId: string) => {
  let progress = await Progress.findOne({ userId, courseId })
    .populate('completedLectures', 'title order')
    .populate('currentLecture', 'title order');

  if (!progress) {
    // If no progress exists, initialize a new one
    const firstLecture = await Lecture.findOne({ courseId }).sort({ order: 1 });

    progress = new Progress({
      userId,
      courseId,
      completedLectures: [],
      currentLecture: firstLecture?._id,
      progressPercentage: 0,
    });

    await progress.save();
    await progress.populate('completedLectures currentLecture');
  }

  return progress;
};

const getUserProgress = async (userId: string) => {
  const progressList = await Progress.find({ userId })
    .populate('courseId', 'title thumbnail')
    .populate('currentLecture', 'title')
    .sort({ lastAccessed: -1 });

  return progressList;
};

const markLectureComplete = async (
  courseId: string,
  lectureId: string,
  userId: string,
) => {
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  let progress = await Progress.findOne({ userId, courseId });

  if (!progress) {
    progress = new Progress({
      userId,
      courseId,
      completedLectures: [],
      currentLecture: lectureId,
      progressPercentage: 0,
    });
  }

  // Add lecture to completed list if not already completed
  if (!progress.completedLectures.some(id => id.toString() === lectureId)) {
    progress.completedLectures.push(new Types.ObjectId(lectureId));
  }

  // Get total lectures in course to calculate percentage
  const totalLectures = await Lecture.countDocuments({ courseId });
  progress.progressPercentage =
    (progress.completedLectures.length / totalLectures) * 100;

  // Find next unlocked lecture to set as current
  const allLectures = await Lecture.find({ courseId }).sort({ order: 1 });
  const currentLectureIndex = allLectures.findIndex(
    l => l._id.toString() === lectureId.toString(),
  );

  if (currentLectureIndex < allLectures.length - 1) {
    const nextLecture = allLectures[currentLectureIndex + 1];
    progress.currentLecture = nextLecture._id;
  } else {
    progress.currentLecture = new Types.ObjectId(lectureId);
  }

  progress.lastAccessed = new Date();
  await progress.save();

  await progress.populate('completedLectures currentLecture');

  const nextAvailableLecture =
    currentLectureIndex < allLectures.length - 1
      ? allLectures[currentLectureIndex + 1]
      : null;

  return {
    progress,
    nextLecture: nextAvailableLecture,
    courseCompleted: progress.progressPercentage === 100,
  };
};

const updateCurrentLecture = async (
  courseId: string,
  lectureId: string,
  userId: string,
) => {
  // Find the lecture
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  // Find or create progress
  let progress = await Progress.findOne({ userId, courseId });

  if (!progress) {
    progress = new Progress({
      userId,
      courseId,
      completedLectures: [],
      currentLecture: new Types.ObjectId(lectureId),
      progressPercentage: 0,
      lastAccessed: new Date(),
    });
  } else {
    progress.currentLecture = new Types.ObjectId(lectureId);
    progress.lastAccessed = new Date();
  }

  await progress.save();
  await progress.populate('completedLectures currentLecture');

  return progress;
};

const checkLectureAccess = async (
  courseId: string,
  lectureId: string,
  userId: string,
) => {
  const lecture = await Lecture.findById(lectureId);
  if (!lecture) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Lecture not found');
  }

  const progress = await Progress.findOne({ userId, courseId });

  // If no progress, user can only access the first lecture
  if (!progress) {
    const firstLecture = await Lecture.findOne({ courseId }).sort({ order: 1 });
    const canAccess =
      lecture.order === 1 ||
      lecture._id.toString() === firstLecture?._id.toString();
    return {
      canAccess,
      reason: canAccess ? null : 'Complete previous lectures first',
      isCompleted: false,
      isCurrent: false,
    };
  }

  // User can access completed lectures, current lecture, or the next lecture
  const isCompleted = progress.completedLectures.some(
    id => id.toString() === lectureId,
  );
  const isCurrent = progress.currentLecture?.toString() === lectureId;

  // Find the last completed lecture to determine next available
  const completedLecturesList = await Lecture.find({
    _id: { $in: progress.completedLectures },
    courseId,
  }).sort({ order: 1 });

  const lastCompletedOrder =
    completedLecturesList.length > 0
      ? completedLecturesList[completedLecturesList.length - 1].order
      : 0;

  const isNextAvailable = lecture.order <= lastCompletedOrder + 1;
  const canAccess = isCompleted || isCurrent || isNextAvailable;

  return {
    canAccess,
    reason: canAccess ? null : 'Complete previous lectures first',
    isCompleted,
    isCurrent,
  };
};

export const ProgressService = {
  getCourseProgress,
  getUserProgress,
  markLectureComplete,
  updateCurrentLecture,
  checkLectureAccess,
};
