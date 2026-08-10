require('dotenv').config();

const mongoose = require('mongoose');

const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');

const learningData = require('./learningData/moneyBasics');

async function connectDatabase() {
  const mongoUri =
    process.env.MONGO_URI || 'mongodb://localhost:27017/xylotix';

  await mongoose.connect(mongoUri);

  console.log('Connected to MongoDB.');
}

async function seedCourse(courseData) {
  return Course.findOneAndUpdate(
    { slug: courseData.slug },
    {
      $set: courseData
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

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
        order: moduleData.order
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
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
        estimatedDuration: lessonData.estimatedDuration,
        order: lessonData.order,
        published: lessonData.published,
        contentBlocks: lessonData.contentBlocks || []
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

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
        options: quizData.options || [],
        correctAnswer: quizData.correctAnswer,
        explanation: quizData.explanation,
        points: quizData.points
      }
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true
    }
  );
}

async function seedLearning() {
  try {
    await connectDatabase();

    /*
     * 1. Course
     */
    const course = await seedCourse(learningData.course);

    console.log(`Course seeded: ${course.title}`);

    /*
     * 2. Modules
     */
    for (const moduleData of learningData.modules) {
      const module = await seedModule(
        course._id,
        moduleData
      );

      console.log(`  Module seeded: ${module.title}`);

      /*
       * 3. Lessons
       */
      for (const lessonData of moduleData.lessons) {
        const lesson = await seedLesson(
          module._id,
          lessonData
        );

        console.log(`    Lesson seeded: ${lesson.title}`);

        /*
         * 4. Quizzes
         */
        const quizzes = lessonData.quizzes || [];

        for (const quizData of quizzes) {
          const quiz = await seedQuiz(
            lesson._id,
            quizData
          );

          console.log(
            `      Quiz seeded: ${quiz.question}`
          );
        }
      }
    }

    console.log(
      'Learning database seeding completed successfully.'
    );
  } catch (error) {
    console.error(
      'Learning database seeding failed:',
      error
    );

    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
}

seedLearning();
