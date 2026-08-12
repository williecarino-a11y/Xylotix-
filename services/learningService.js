const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const UserProgress = require('../models/UserProgress');

class LearningService {
  /**
   * Get all published courses.
   */
  async getAllCourses() {
    return await Course.find({ published: true })
      .sort({ order: 1 });
  }

  /**
   * Get a complete course tree:
   *
   * Course
   *   └── Modules
   *        └── Lessons
   *             └── Quizzes
   */
  async getCourseDetails(courseId) {
    const course = await Course.findById(courseId);

    if (!course) {
      throw new Error('Course not found');
    }

    const modules = await Module.find({ courseId })
      .sort({ order: 1 });

    const moduleIds = modules.map(module => module._id);

    const lessons = await Lesson.find({
      moduleId: { $in: moduleIds },
      published: true
    }).sort({ order: 1 });

    const lessonIds = lessons.map(lesson => lesson._id);

    const quizzes = await Quiz.find({
      lessonId: { $in: lessonIds }
    }).sort({ order: 1 });

    const structuredModules = modules.map(module => {
      const moduleLessons = lessons
        .filter(
          lesson =>
            lesson.moduleId.toString() ===
            module._id.toString()
        )
        .map(lesson => {
          const lessonQuizzes = quizzes
            .filter(
              quiz =>
                quiz.lessonId.toString() ===
                lesson._id.toString()
            )
            .map(quiz => quiz.toObject());

          return {
            ...lesson.toObject(),
            quizzes: lessonQuizzes
          };
        });

      return {
        ...module.toObject(),
        lessons: moduleLessons
      };
    });

    return {
      ...course.toObject(),
      modules: structuredModules
    };
  }

  /**
   * Get a single lesson together with its quizzes.
   */
  async getLessonWithQuiz(lessonId) {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const quizzes = await Quiz.find({ lessonId })
      .sort({ order: 1 });

    return {
      lesson,
      quizzes
    };
  }

  /**
   * Validate quiz answers for a lesson.
   *
   * Supports:
   * - numeric correctAnswerIndex
   * - numeric correctAnswer
   * - string correctAnswer
   */
  async submitQuizAnswers(
    lessonId,
    submittedAnswers
  ) {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const quizzes = await Quiz.find({ lessonId })
      .sort({ order: 1 });

    if (!quizzes.length) {
      return {
        score: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        passed: true,
        results: []
      };
    }

    if (!Array.isArray(submittedAnswers)) {
      submittedAnswers = [];
    }

    let correctAnswers = 0;

    const results = quizzes.map((quiz, index) => {
      const submitted = submittedAnswers[index];

      const correctIndex =
        quiz.correctAnswerIndex !== undefined
          ? Number(quiz.correctAnswerIndex)
          : (
              typeof quiz.correctAnswer === 'number'
                ? Number(quiz.correctAnswer)
                : null
            );

      let isCorrect = false;

      if (
        correctIndex !== null &&
        submitted !== undefined &&
        Number(submitted) === correctIndex
      ) {
        isCorrect = true;
      }

      if (
        typeof quiz.correctAnswer === 'string' &&
        typeof submitted === 'string' &&
        submitted.trim().toLowerCase() ===
          quiz.correctAnswer.trim().toLowerCase()
      ) {
        isCorrect = true;
      }

      if (isCorrect) {
        correctAnswers++;
      }

      return {
        quizId: quiz._id,
        correct: isCorrect
      };
    });

    const score = Math.round(
      (correctAnswers / quizzes.length) * 100
    );

    return {
      score,
      totalQuestions: quizzes.length,
      correctAnswers,
      passed: score >= 50,
      results
    };
  }

  /**
   * Record lesson completion and quiz score.
   */
  async recordLessonProgress(
    userId,
    lessonId,
    submittedAnswers
  ) {
    const lesson = await Lesson.findById(lessonId);

    if (!lesson) {
      throw new Error('Lesson not found');
    }

    const quizResult =
      await this.submitQuizAnswers(
        lessonId,
        submittedAnswers
      );

    const progress =
      await UserProgress.findOneAndUpdate(
        {
          userId,
          lessonId
        },
        {
          completed: true,
          quizScore: quizResult.score,
          completedAt: new Date()
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

    return {
      success: true,
      progress,
      quizResult,
      message:
        'Lesson progress recorded successfully'
    };
  }

  /**
   * Get dynamically calculated dashboard statistics.
   */
  async getUserDashboardStats(userId) {
    const allProgress = await UserProgress.find({
      userId,
      completed: true
    }).sort({
      completedAt: 1
    });

    const totalLessonsCompleted =
      allProgress.length;

    const scoredQuizzes =
      allProgress.filter(
        progress =>
          progress.quizScore !== null &&
          progress.quizScore !== undefined
      );

    const averageQuizScore =
      scoredQuizzes.length > 0
        ? Math.round(
            scoredQuizzes.reduce(
              (total, progress) =>
                total + progress.quizScore,
              0
            ) / scoredQuizzes.length
          )
        : 0;

    const streak =
      this.calculateStreak(allProgress);

    const totalXP =
      totalLessonsCompleted * 50;

    return {
      totalLessonsCompleted,
      averageQuizScore,
      streak,
      totalXP
    };
  }

  /**
   * Calculate current consecutive-day streak.
   */
  calculateStreak(progressRecords) {
    if (
      !progressRecords ||
      progressRecords.length === 0
    ) {
      return 0;
    }

    const completedDates = new Set();

    progressRecords.forEach(progress => {
      if (!progress.completedAt) {
        return;
      }

      const date =
        new Date(progress.completedAt);

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dateKey =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate()
        ).getTime();

      completedDates.add(dateKey);
    });

    if (completedDates.size === 0) {
      return 0;
    }

    const dates =
      Array.from(completedDates).sort(
        (a, b) => b - a
      );

    const today = new Date();

    const todayKey =
      new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).getTime();

    const yesterday =
      new Date(today);

    yesterday.setDate(
      yesterday.getDate() - 1
    );

    const yesterdayKey =
      new Date(
        yesterday.getFullYear(),
        yesterday.getMonth(),
        yesterday.getDate()
      ).getTime();

    let currentDate = dates[0];

    if (
      currentDate !== todayKey &&
      currentDate !== yesterdayKey
    ) {
      return 0;
    }

    let streak = 1;

    for (
      let i = 1;
      i < dates.length;
      i++
    ) {
      const previousDate = dates[i - 1];
      const current = dates[i];

      const differenceInDays =
        (previousDate - current) /
        (1000 * 60 * 60 * 24);

      if (differenceInDays === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

module.exports = new LearningService();
