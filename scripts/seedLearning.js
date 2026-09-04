require('dotenv').config();

const mongoose = require('mongoose');

const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');

const learningDataSets = [
  require('./learningData/moneyBasics.new'),
  require('./learningData/investingFundamentals')
];

/*
 * =========================================================
 * DATABASE
 * =========================================================
 */

async function connectDatabase() {
  const mongoUri =
    process.env.MONGO_URL ||
    process.env.MONGO_URI ||
    'mongodb://localhost:27017/miimiid';

  await mongoose.connect(mongoUri);

  console.log('Connected to MongoDB.');
}

/*
 * =========================================================
 * COURSE
 * =========================================================
 */

async function seedCourse(courseData) {
  return Course.findOneAndUpdate(
    {
      slug: courseData.slug
    },
    {
      $set: {
        slug: courseData.slug,
        title: courseData.title,
        description: courseData.description,
        longDescription: courseData.longDescription,
        category: courseData.category,
        difficulty: courseData.difficulty,
        estimatedDuration: courseData.estimatedDuration,

        prerequisites: courseData.prerequisites || [],
        targetAudience: courseData.targetAudience || [],
        learningObjectives: courseData.learningObjectives || [],
        skillsGained: courseData.skillsGained || [],
        outcomes: courseData.outcomes || [],

        order: courseData.order,
        published: courseData.published
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );
}

/*
 * =========================================================
 * MODULE
 * =========================================================
 */

async function seedModule(courseId, moduleData) {
  return Module.findOneAndUpdate(
    {
      courseId,
      slug: moduleData.slug
    },
    {
      $set: {
        courseId,
        slug: moduleData.slug,
        title: moduleData.title,
        description: moduleData.description,
        introduction: moduleData.introduction || moduleData.description || '',
        learningObjectives: moduleData.learningObjectives || [],
        estimatedDuration: moduleData.estimatedDuration || 1,
        skillsGained: moduleData.skillsGained || [],
        outcomes: moduleData.outcomes || [],
        order: moduleData.order,
        published:
          moduleData.published !== undefined
            ? moduleData.published
            : true
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );
}

/*
 * =========================================================
 * LESSON
 * =========================================================
 */

function normalizeContentBlocks(contentBlocks) {
  if (!Array.isArray(contentBlocks)) {
    return [];
  }

  return contentBlocks.map((block, index) => {
    if (!block || typeof block !== 'object') {
      return {
        order: index + 1,
        type: 'text',
        data: {
          text: String(block ?? '')
        }
      };
    }

    const type = block.type || 'text';

    // New format:
    // {
    //   order: 1,
    //   type: 'text',
    //   data: { text: '...' }
    // }
    //
    // Preserve the existing data object exactly.
    if (
      block.data !== undefined &&
      block.data !== null
    ) {
      return {
        order: index + 1,
        type,
        data: block.data
      };
    }

    // Legacy format:
    // {
    //   type: 'text',
    //   content: '...'
    // }
    if (block.content !== undefined) {
      const { content } = block;

      const rest = { ...block };
      delete rest.type;
      delete rest.content;
      delete rest.order;

      let data;

      if (
        typeof content === 'object' &&
        content !== null
      ) {
        data = {
          ...rest,
          ...content
        };
      } else {
        data = {
          ...rest,
          content
        };
      }

      return {
        order: index + 1,
        type,
        data
      };
    }

    // Fallback for simple blocks without data/content.
    const rest = { ...block };
    delete rest.type;
    delete rest.order;

    return {
      order: index + 1,
      type,
      data: rest
    };
  });
}

async function seedLesson(moduleId, lessonData) {
  return Lesson.findOneAndUpdate(
    {
      moduleId,
      slug: lessonData.slug
    },
    {
      $set: {
        moduleId,
        slug: lessonData.slug,
        title: lessonData.title,
        description: lessonData.description || '',
        learningObjectives:
          lessonData.learningObjectives || [],
        estimatedDuration: lessonData.estimatedDuration,
        order: lessonData.order,
        published:
          lessonData.published !== undefined
            ? lessonData.published
            : false,
        contentBlocks: normalizeContentBlocks(
          lessonData.contentBlocks
        )
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );
}

/*
 * =========================================================
 * QUIZ
 * =========================================================
 */

async function seedQuiz(lessonId, quizData) {
  return Quiz.findOneAndUpdate(
    {
      lessonId,
      order: quizData.order
    },
    {
      $set: {
        lessonId,
        order: quizData.order,
        questionType: quizData.questionType,
        question: quizData.question,
        context: quizData.context || '',
        options: quizData.options || [],
        correctAnswer: quizData.correctAnswer,
        explanation: quizData.explanation,

        hint: quizData.hint || '',

        correctFeedback:
          quizData.correctFeedback ||
          'Excellent! 🎉 Your answer is correct.',

        incorrectFeedback:
          quizData.incorrectFeedback ||
          'Not quite! Review the lesson and try again.',

        difficulty:
          quizData.difficulty || 'Easy',

        skills: quizData.skills || [],

        learningObjectives:
          quizData.learningObjectives || [],

        isPractical:
          quizData.isPractical || false,

        media: quizData.media || undefined,

        points: quizData.points || 10,

        published:
          quizData.published !== undefined
            ? quizData.published
            : true
      }
    },
    {
      upsert: true,
      returnDocument: 'after',
      setDefaultsOnInsert: true,
      runValidators: true
    }
  );
}

/*
 * =========================================================
 * REMOVE STALE QUIZZES
 * =========================================================
 */

async function syncQuizzes(lessonId, quizzes) {
  const validOrders = quizzes.map(
    (quiz) => quiz.order
  );

  const filter = {
    lessonId
  };

  if (validOrders.length > 0) {
    filter.order = {
      $nin: validOrders
    };
  }

  const result = await Quiz.deleteMany(filter);

  if (result.deletedCount > 0) {
    console.log(
      `      Removed ${result.deletedCount} stale quiz record(s).`
    );
  }
}

/*
 * =========================================================
 * REMOVE STALE LESSONS
 * =========================================================
 */

async function syncLessons(moduleId, lessons) {
  const validSlugs = lessons.map(
    (lesson) => lesson.slug
  );

  const filter = {
    moduleId
  };

  if (validSlugs.length > 0) {
    filter.slug = {
      $nin: validSlugs
    };
  }

  const staleLessons = await Lesson.find(filter)
    .select('_id')
    .lean();

  if (staleLessons.length === 0) {
    return;
  }

  const staleLessonIds = staleLessons.map(
    (lesson) => lesson._id
  );

  await Quiz.deleteMany({
    lessonId: {
      $in: staleLessonIds
    }
  });

  const result = await Lesson.deleteMany({
    _id: {
      $in: staleLessonIds
    }
  });

  if (result.deletedCount > 0) {
    console.log(
      `    Removed ${result.deletedCount} stale lesson record(s).`
    );
  }
}

/*
 * =========================================================
 * REMOVE STALE MODULES
 * =========================================================
 */

async function syncModules(courseId, modules) {
  const validSlugs = modules.map(
    (module) => module.slug
  );

  const filter = {
    courseId
  };

  if (validSlugs.length > 0) {
    filter.slug = {
      $nin: validSlugs
    };
  }

  const staleModules = await Module.find(filter)
    .select('_id')
    .lean();

  if (staleModules.length === 0) {
    return;
  }

  const staleModuleIds = staleModules.map(
    (module) => module._id
  );

  /*
   * Find lessons belonging to stale modules.
   */

  const staleLessons = await Lesson.find({
    moduleId: {
      $in: staleModuleIds
    }
  })
    .select('_id')
    .lean();

  const staleLessonIds = staleLessons.map(
    (lesson) => lesson._id
  );

  /*
   * Remove quizzes belonging to those lessons.
   */

  if (staleLessonIds.length > 0) {
    await Quiz.deleteMany({
      lessonId: {
        $in: staleLessonIds
      }
    });

    await Lesson.deleteMany({
      _id: {
        $in: staleLessonIds
      }
    });
  }

  /*
   * Remove the stale modules.
   */

  const result = await Module.deleteMany({
    _id: {
      $in: staleModuleIds
    }
  });

  if (result.deletedCount > 0) {
    console.log(
      `  Removed ${result.deletedCount} stale module record(s).`
    );
  }
}

/*
 * =========================================================
 * MAIN SEED
 * =========================================================
 */

async function seedLearning() {
  try {
    await connectDatabase();

    for (const learningData of learningDataSets) {
      /*
       * Validate course structure.
       */

      if (!learningData || !learningData.course) {
        throw new Error(
          'learningData.course is missing.'
        );
      }

      if (!Array.isArray(learningData.modules)) {
        throw new Error(
          'learningData.modules must be an array.'
        );
      }

      /*
       * -------------------------------------------------------
       * 1. COURSE
       * -------------------------------------------------------
       */

      const course = await seedCourse(
        learningData.course
      );

      console.log(
        `Course synced: ${course.title} (${course.slug})`
      );

      /*
       * -------------------------------------------------------
       * 2. MODULES
       * -------------------------------------------------------
       */

      for (const moduleData of learningData.modules) {
        const module = await seedModule(
          course._id,
          moduleData
        );

        console.log(
          `  Module synced: ${module.title} (${module.slug})`
        );

        const lessons = Array.isArray(
          moduleData.lessons
        )
          ? moduleData.lessons
          : [];

        /*
         * -----------------------------------------------------
         * 3. LESSONS
         * -----------------------------------------------------
         */

        for (const lessonData of lessons) {
          const lesson = await seedLesson(
            module._id,
            lessonData
          );

          console.log(
            `    Lesson synced: ${lesson.title} (${lesson.slug})`
          );

          const quizzes = Array.isArray(
            lessonData.quizzes
          )
            ? lessonData.quizzes
            : [];

          /*
           * ---------------------------------------------------
           * 4. QUIZZES
           * ---------------------------------------------------
           */

          for (const quizData of quizzes) {
            const quiz = await seedQuiz(
              lesson._id,
              quizData
            );

            console.log(
              `      Quiz synced: ${quiz.question}`
            );
          }

          /*
           * Remove quizzes that are no longer
           * present in seed data.
           */

          await syncQuizzes(
            lesson._id,
            quizzes
          );
        }

        /*
         * Remove lessons that are no longer
         * present in seed data.
         */

        await syncLessons(
          module._id,
          lessons
        );
      }

      /*
       * -------------------------------------------------------
       * 5. REMOVE STALE MODULES
       * -------------------------------------------------------
       */

      await syncModules(
        course._id,
        learningData.modules
      );
    }

    console.log(
      '\nLearning database synchronization completed successfully.'
    );
  } catch (error) {
    console.error(
      '\nLearning database synchronization failed:'
    );

    console.error(error);

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();

    console.log(
      'MongoDB connection closed.'
    );
  }
}

/*
 * =========================================================
 * START
 * =========================================================
 */

seedLearning();
