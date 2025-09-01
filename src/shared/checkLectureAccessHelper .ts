import { Lecture } from '../app/modules/lecture/lecture.model';
import { Progress } from '../app/modules/progress/progress.model';

/* eslint-disable @typescript-eslint/no-explicit-any */
export const checkLectureAccessHelper = async (
  courseId: any,
  userId: any,
  lectureId: any,
  allLectures?: any[],
) => {
  if (!allLectures) {
    allLectures = await Lecture.find({ courseId }).sort({ order: 1 });
  }

  const lecture = allLectures.find(
    l => l._id.toString() === lectureId.toString(),
  );
  if (!lecture) {
    return { canAccess: false, reason: 'Lecture not found' };
  }

  const progress = await Progress.findOne({ userId, courseId });

  // No progress → only first lecture
  if (!progress) {
    return {
      canAccess: lecture.order === 1,
      reason: lecture.order === 1 ? null : 'Start with the first lecture',
    };
  }

  if (progress.completedLectures.includes(lectureId)) {
    return { canAccess: true, reason: 'Completed' };
  }

  if (progress.currentLecture?.toString() === lectureId.toString()) {
    return { canAccess: true, reason: 'Current lecture' };
  }

  const lectureIndex = allLectures.findIndex(
    l => l._id.toString() === lectureId.toString(),
  );

  if (lectureIndex === 0) {
    return { canAccess: true, reason: 'First lecture' };
  }

  const previousLectures = allLectures.slice(0, lectureIndex);
  const allPreviousCompleted = previousLectures.every(prevLecture =>
    progress.completedLectures.some(
      completedId => completedId.toString() === prevLecture._id.toString(),
    ),
  );

  if (allPreviousCompleted) {
    return { canAccess: true, reason: 'Previous lectures completed' };
  }

  const firstIncomplete = previousLectures.find(
    prevLecture =>
      !progress.completedLectures.some(
        completedId => completedId.toString() === prevLecture._id.toString(),
      ),
  );

  return {
    canAccess: false,
    reason: `Complete "${firstIncomplete?.title || 'previous lectures'}" first`,
  };
};
