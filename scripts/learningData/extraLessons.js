/*
 * Extra Money Basics lessons
 * --------------------------
 * These lessons live as JSON files in content/money-basics/.
 * seedLearning.js adds them to the course data so the seed
 * keeps them (and never deletes them as "stale").
 *
 * To add another lesson later: add one line to EXTRA_LESSONS below.
 *
 * Check without touching the database:
 *   node scripts/learningData/extraLessons.js
 */

const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(
  __dirname,
  '..',
  '..',
  'content',
  'money-basics'
);

const EXTRA_LESSONS = {
  'money-basics': [
    {
      file: 'module5-lesson5.json',
      moduleSlug: 'smart-money-decisions'
    },
    {
      file: 'module6-lesson5.json',
      moduleSlug: 'cash-flow-and-money-management'
    }
  ]
};

function readLessonFile(entry) {
  const filePath = path.join(CONTENT_DIR, entry.file);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Extra lesson file not found: content/money-basics/${entry.file}`
    );
  }

  let raw;

  try {
    raw = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(
      `${entry.file} is not valid JSON: ${error.message}`
    );
  }

  const src =
    raw && raw.lesson && typeof raw.lesson === 'object'
      ? raw.lesson
      : raw;

  const keys = Object.keys(src || {}).join(', ');

  const blocks = src.contentBlocks || src.blocks;
  const rawQuiz =
    src.quizzes || src.quiz || raw.quizzes || raw.quiz;

  if (!src.slug || !src.title) {
    throw new Error(
      `${entry.file} needs a slug and a title. Keys found: ${keys}`
    );
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error(
      `${entry.file} has no contentBlocks. Keys found: ${keys}`
    );
  }

  if (!Array.isArray(rawQuiz) || rawQuiz.length === 0) {
    throw new Error(
      `${entry.file} has no quiz questions. Keys found: ${keys}`
    );
  }

  const quizzes = rawQuiz.map((item, index) => {
    const quiz = { ...item };

    if (quiz.order === undefined) {
      quiz.order = index + 1;
    }

    if (!quiz.questionType) {
      const isTrueFalse =
        Array.isArray(quiz.options) &&
        quiz.options.length === 2 &&
        /^true$/i.test(String(quiz.options[0]));

      quiz.questionType = isTrueFalse
        ? 'true-false'
        : 'multiple-choice';
    }

    if (
      !quiz.question ||
      !Array.isArray(quiz.options) ||
      quiz.correctAnswer === undefined ||
      !quiz.explanation
    ) {
      throw new Error(
        `${entry.file}: quiz question ${index + 1} is missing a question, options, correctAnswer or explanation.`
      );
    }

    return quiz;
  });

  return {
    slug: src.slug,
    title: src.title,
    description: src.description || '',
    learningObjectives: src.learningObjectives || [],
    estimatedDuration: src.estimatedDuration || 20,
    order: src.order,
    published: src.published !== undefined ? src.published : true,
    contentBlocks: blocks,
    quizzes
  };
}

function mergeExtraLessons(learningDataSets) {
  for (const data of learningDataSets) {
    const courseSlug = data && data.course && data.course.slug;
    const entries = EXTRA_LESSONS[courseSlug];

    if (!entries) {
      continue;
    }

    for (const entry of entries) {
      const targetModule = data.modules.find(
        (item) => item.slug === entry.moduleSlug
      );

      if (!targetModule) {
        throw new Error(
          `Module "${entry.moduleSlug}" not found in course "${courseSlug}".`
        );
      }

      const lesson = readLessonFile(entry);

      if (
        targetModule.lessons.some(
          (item) => item.slug === lesson.slug
        )
      ) {
        console.log(
          `Extra lesson already in course data, skipped: ${lesson.slug}`
        );
        continue;
      }

      const taken = new Set(
        targetModule.lessons.map((item) => item.order)
      );

      let order = Number(lesson.order);

      if (!Number.isInteger(order) || taken.has(order)) {
        order =
          Math.max(0, ...targetModule.lessons.map((item) => item.order)) + 1;
      }

      lesson.order = order;
      targetModule.lessons.push(lesson);

      console.log(
        `Extra lesson added: ${lesson.title} -> ${targetModule.slug} (lesson ${order}, ${lesson.contentBlocks.length} blocks, ${lesson.quizzes.length} questions)`
      );
    }
  }

  return learningDataSets;
}

module.exports = { mergeExtraLessons };

if (require.main === module) {
  const sets = mergeExtraLessons([require('./moneyBasics.new')]);

  for (const data of sets) {
    let total = 0;

    for (const item of data.modules) {
      total += item.lessons.length;
      console.log(
        `Module ${item.order} ${item.slug}: ${item.lessons.length} lessons`
      );
    }

    console.log(`Total lessons: ${total}`);
  }
}
