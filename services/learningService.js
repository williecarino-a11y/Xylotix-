const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const UserProgress = require('../models/UserProgress');

class LearningService {
  /**
   * =========================================================
   * SAFE QUIZ RESPONSE
   * =========================================================
   *
   * Converts a Quiz document into the version that is safe
   * to send to the browser.
   *
   * IMPORTANT:
   * correctAnswer is intentionally NOT included.
   *
   * The server keeps the correct answer private and uses it
   * when the learner submits the quiz.
   */
  sanitizeQuiz(quiz) {
    const data =
      typeof quiz.toObject === 'function'
        ? quiz.toObject()
        : quiz;

    return {
      _id: data._id,
      lessonId: data.lessonId,
      order: data.order,
      questionType: data.questionType,
      question: data.question,
      context: data.context || '',
      options: Array.isArray(data.options)
        ? data.options
        : [],
      explanation: data.explanation || '',
      hint: data.hint || '',
      correctFeedback:
        data.correctFeedback ||
        'Excellent! 🎉 Your answer is correct.',
      incorrectFeedback:
        data.incorrectFeedback ||
        'Not quite! Review the lesson and try again.',
      difficulty: data.difficulty || 'Easy',
      skills: Array.isArray(data.skills)
        ? data.skills
        : [],
      learningObjectives:
        Array.isArray(data.learningObjectives)
          ? data.learningObjectives
          : [],
      isPractical:
        data.isPractical === true,
      media: data.media || null,
      points:
        typeof data.points === 'number'
          ? data.points
          : 10,
      published:
        data.published !== false
    };
  }

  /**
   * =========================================================
   * GET ALL PUBLISHED COURSES
   * =========================================================
   */
  async getAllCourses() {
    return await Course.find({
      published: true
    }).sort({
      order: 1
    });
  }

  /**
   * =========================================================
   * GET COMPLETE COURSE TREE
   *
   * Course
   *   └── Modules
   *        └── Lessons
   *             └── Quizzes
   * =========================================================
   */
  async getCourseDetails(courseId) {
    const course =
      await Course.findOne({
        _id: courseId,
        published: true
      });

    if (!course) {
      throw new Error('Course not found');
    }

    const modules =
      await Module.find({
        courseId
      }).sort({
        order: 1
      });

    const moduleIds =
      modules.map(
        module => module._id
      );

    const lessons =
      await Lesson.find({
        moduleId: {
          $in: moduleIds
        },
        published: true
      }).sort({
        order: 1
      });

    const lessonIds =
      lessons.map(
        lesson => lesson._id
      );

    const quizzes =
      await Quiz.find({
        lessonId: {
          $in: lessonIds
        },
        published: true
      }).sort({
        order: 1
      });

    const structuredModules =
      modules.map(module => {
        const moduleLessons =
          lessons
            .filter(
              lesson =>
                lesson.moduleId.toString() ===
                module._id.toString()
            )
            .map(lesson => {
              const lessonQuizzes =
                quizzes
                  .filter(
                    quiz =>
                      quiz.lessonId.toString() ===
                      lesson._id.toString()
                  )
                  .map(quiz =>
                    this.sanitizeQuiz(quiz)
                  );

              return {
                ...lesson.toObject(),
                quizzes:
                  lessonQuizzes
              };
            });

        return {
          ...module.toObject(),
          lessons:
            moduleLessons
        };
      });

    return {
      ...course.toObject(),
      modules:
        structuredModules
    };
  }

  /**
   * =========================================================
   * GET SINGLE LESSON + QUIZZES
   * =========================================================
   */
  async getLessonWithQuiz(
    lessonId
  ) {
    const lesson =
      await Lesson.findOne({
        _id: lessonId,
        published: true
      });

    if (!lesson) {
      throw new Error(
        'Lesson not found'
      );
    }

    const quizzes =
      await Quiz.find({
        lessonId,
        published: true
      }).sort({
        order: 1
      });

    return {
      lesson,
      quizzes:
        quizzes.map(quiz =>
          this.sanitizeQuiz(quiz)
        )
    };
  }

  /**
   * =========================================================
   * VALIDATE QUIZ ANSWERS
   * =========================================================
   *
   * The correct answer remains on the server.
   *
   * Supports:
   * - multiple-choice
   * - true-false
   * - calculate
   */
  async submitQuizAnswers(
    lessonId,
    submittedAnswers
  ) {
    const lesson =
      await Lesson.findById(
        lessonId
      );

    if (!lesson) {
      throw new Error(
        'Lesson not found'
      );
    }

    const quizzes =
      await Quiz.find({
        lessonId,
        published: true
      }).sort({
        order: 1
      });

    if (!quizzes.length) {
      return {
        score: 0,
        totalQuestions: 0,
        correctAnswers: 0,
        passed: true,
        results: []
      };
    }

    if (
      !Array.isArray(
        submittedAnswers
      )
    ) {
      submittedAnswers = [];
    }

    let correctAnswers = 0;

    const results =
      quizzes.map(
        (quiz, index) => {
          const submitted =
            submittedAnswers[index];

          let isCorrect =
            false;

          /*
           * -----------------------------------------------
           * MULTIPLE-CHOICE
           * -----------------------------------------------
           */
          if (
            quiz.questionType ===
            'multiple-choice'
          ) {
            if (
              submitted !==
                undefined &&
              Number.isInteger(
                Number(submitted)
              ) &&
              Number(submitted) ===
                Number(
                  quiz.correctAnswer
                )
            ) {
              isCorrect = true;
            }
          }

          /*
           * -----------------------------------------------
           * TRUE / FALSE
           * -----------------------------------------------
           */
          else if (
            quiz.questionType ===
            'true-false'
          ) {
            if (
              submitted !==
                undefined &&
              Number(submitted) ===
                Number(
                  quiz.correctAnswer
                )
            ) {
              isCorrect = true;
            }
          }

          /*
           * -----------------------------------------------
           * CALCULATION
           * -----------------------------------------------
           */
          else if (
            quiz.questionType ===
            'calculate'
          ) {
            const submittedNumber =
              Number(submitted);

            const correctNumber =
              Number(
                quiz.correctAnswer
              );

            if (
              Number.isFinite(
                submittedNumber
              ) &&
              Number.isFinite(
                correctNumber
              ) &&
              submittedNumber ===
                correctNumber
            ) {
              isCorrect = true;
            }
          }

          if (isCorrect) {
            correctAnswers++;
          }

          return {
            quizId:
              quiz._id,
            correct:
              isCorrect
          };
        }
      );

    const score =
      Math.round(
        (correctAnswers /
          quizzes.length) *
          100
      );

    return {
      score,
      totalQuestions:
        quizzes.length,
      correctAnswers,
      passed:
        score >= 50,
      results
    };
  }

  /**
   * =========================================================
   * RECORD LESSON COMPLETION
   * =========================================================
   */
  async recordLessonProgress(
    userId,
    lessonId,
    submittedAnswers
  ) {
    const lesson =
      await Lesson.findById(
        lessonId
      );

    if (!lesson) {
      throw new Error(
        'Lesson not found'
      );
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
          quizScore:
            quizResult.score,
          completedAt:
            new Date()
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert:
            true
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
   * =========================================================
   * GET USER DASHBOARD STATISTICS
   * =========================================================
   */
  async getUserDashboardStats(
    userId
  ) {
    const allProgress =
      await UserProgress.find({
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
          progress.quizScore !==
            null &&
          progress.quizScore !==
            undefined
      );

    const averageQuizScore =
      scoredQuizzes.length > 0
        ? Math.round(
            scoredQuizzes.reduce(
              (
                total,
                progress
              ) =>
                total +
                progress.quizScore,
              0
            ) /
              scoredQuizzes.length
          )
        : 0;

    const streak =
      this.calculateStreak(
        allProgress
      );

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
   * =========================================================
   * CALCULATE CURRENT CONSECUTIVE-DAY STREAK
   * =========================================================
   */
  calculateStreak(
    progressRecords
  ) {
    if (
      !progressRecords ||
      progressRecords.length ===
        0
    ) {
      return 0;
    }

    const completedDates =
      new Set();

    progressRecords.forEach(
      progress => {
        if (
          !progress.completedAt
        ) {
          return;
        }

        const date =
          new Date(
            progress.completedAt
          );

        if (
          Number.isNaN(
            date.getTime()
          )
        ) {
          return;
        }

        const dateKey =
          new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate()
          ).getTime();

        completedDates.add(
          dateKey
        );
      }
    );

    if (
      completedDates.size === 0
    ) {
      return 0;
    }

    const dates =
      Array.from(
        completedDates
      ).sort(
        (a, b) => b - a
      );

    const today =
      new Date();

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

    let currentDate =
      dates[0];

    if (
      currentDate !==
        todayKey &&
      currentDate !==
        yesterdayKey
    ) {
      return 0;
    }

    let streak = 1;

    for (
      let i = 1;
      i < dates.length;
      i++
    ) {
      const previousDate =
        dates[i - 1];

      const current =
        dates[i];

      const differenceInDays =
        (previousDate -
          current) /
        (1000 *
          60 *
          60 *
          24);

      if (
        differenceInDays === 1
      ) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  }
}

module.exports =
  new LearningService();
