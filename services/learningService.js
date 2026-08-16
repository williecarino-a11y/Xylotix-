const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const UserProgress = require('../models/UserProgress');
const translationService =
  require('./translationService');

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
  async getAllCourses(targetLanguage = 'en') {
    const courses =
      await Course.find({
        published: true
      }).sort({
        order: 1
      });

    const language =
      translationService.normalizeLanguage(
        targetLanguage
      );

    if (language === 'en') {
      return courses;
    }

    return await Promise.all(
      courses.map(async course => {
        const data =
          course.toObject();

        return {
          ...data,
          title:
            await translationService.translateString({
              sourceType: 'course',
              sourceId: course._id,
              value: data.title,
              targetLanguage: language,
              fieldName: 'title'
            }),
          description:
            await translationService.translateString({
              sourceType: 'course',
              sourceId: course._id,
              value: data.description,
              targetLanguage: language,
              fieldName: 'description'
            }),
          longDescription:
            await translationService.translateString({
              sourceType: 'course',
              sourceId: course._id,
              value: data.longDescription,
              targetLanguage: language,
              fieldName: 'longDescription'
            })
        };
      })
    );
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
  async getCourseDetails(
    courseId,
    targetLanguage = 'en'
  ) {
    const language =
      translationService.normalizeLanguage(
        targetLanguage
      );

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

    const courseData = {
      ...course.toObject(),
      modules:
        structuredModules
    };

    if (language === 'en') {
      return courseData;
    }

    courseData.title =
      await translationService.translateString({
        sourceType: 'course',
        sourceId: course._id,
        value: courseData.title,
        targetLanguage: language,
        fieldName: 'title'
      });

    courseData.description =
      await translationService.translateString({
        sourceType: 'course',
        sourceId: course._id,
        value: courseData.description,
        targetLanguage: language,
        fieldName: 'description'
      });

    courseData.longDescription =
      await translationService.translateString({
        sourceType: 'course',
        sourceId: course._id,
        value: courseData.longDescription,
        targetLanguage: language,
        fieldName: 'longDescription'
      });

    for (const module of courseData.modules) {
      module.title =
        await translationService.translateString({
          sourceType: 'module',
          sourceId: module._id,
          value: module.title,
          targetLanguage: language,
          fieldName: 'title'
        });

      module.description =
        await translationService.translateString({
          sourceType: 'module',
          sourceId: module._id,
          value: module.description,
          targetLanguage: language,
          fieldName: 'description'
        });

      for (const lesson of module.lessons) {
        lesson.title =
          await translationService.translateString({
            sourceType: 'lesson',
            sourceId: lesson._id,
            value: lesson.title,
            targetLanguage: language,
            fieldName: 'title'
          });

        lesson.description =
          await translationService.translateString({
            sourceType: 'lesson',
            sourceId: lesson._id,
            value: lesson.description,
            targetLanguage: language,
            fieldName: 'description'
          });

        lesson.contentBlocks =
          await translationService.translateLessonContent({
            lessonId: lesson._id,
            contentBlocks:
              lesson.contentBlocks || [],
            targetLanguage: language
          });

        lesson.quizzes =
          await Promise.all(
            lesson.quizzes.map(quiz =>
              translationService.translateQuiz({
                quiz,
                targetLanguage: language
              })
            )
          );
      }
    }

    return courseData;
  }

  /**
   * =========================================================
   * GET SINGLE LESSON + QUIZZES
   * =========================================================
   */
  async getLessonWithQuiz(
    lessonId,
    targetLanguage = 'en'
  ) {
    const language =
      translationService.normalizeLanguage(
        targetLanguage
      );

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

    const lessonData =
      lesson.toObject();

    const safeQuizzes =
      quizzes.map(quiz =>
        this.sanitizeQuiz(quiz)
      );

    if (language === 'en') {
      return {
        lesson: lessonData,
        quizzes: safeQuizzes
      };
    }

    lessonData.title =
      await translationService.translateString({
        sourceType: 'lesson',
        sourceId: lesson._id,
        value: lessonData.title,
        targetLanguage: language,
        fieldName: 'title'
      });

    lessonData.contentBlocks =
      await translationService.translateLessonContent({
        lessonId: lesson._id,
        contentBlocks:
          lessonData.contentBlocks || [],
        targetLanguage: language
      });

    const translatedQuizzes =
      await Promise.all(
        safeQuizzes.map(quiz =>
          translationService.translateQuiz({
            quiz,
            targetLanguage: language
          })
        )
      );

    return {
      lesson: lessonData,
      quizzes: translatedQuizzes
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
   * GET COURSE PROGRESS FOR USER
   * =========================================================
   */
  async getCourseProgress(
    courseId,
    userId
  ) {
    const modules =
      await Module.find({
        courseId
      }).select(
        "_id"
      );

    const moduleIds =
      modules.map(
        module => module._id
      );

    const lessons =
      moduleIds.length > 0
        ? await Lesson.find({
            moduleId: {
              $in: moduleIds
            },
            published: true
          }).select(
            "_id moduleId"
          )
        : [];

    const lessonIds =
      lessons.map(
        lesson => lesson._id
      );

    const completedProgress =
      lessonIds.length > 0
        ? await UserProgress.find({
            userId,
            lessonId: {
              $in: lessonIds
            },
            completed: true
          }).select(
            "lessonId quizScore completedAt"
          )
        : [];

    const completedLessonIds =
      completedProgress.map(
        progress =>
          progress.lessonId.toString()
      );

    const totalLessons =
      lessons.length;

    const completedLessons =
      completedProgress.length;

    const progressPercentage =
      totalLessons > 0
        ? Math.round(
            (
              completedLessons /
              totalLessons
            ) * 100
          )
        : 0;

    return {
      courseId,
      totalLessons,
      completedLessons,
      progressPercentage,
      completedLessonIds
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
