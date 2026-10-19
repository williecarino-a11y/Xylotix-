/*
 * Extra Money Basics lessons
 * --------------------------
 * New lessons are written as JSON files in content/money-basics/,
 * named moduleN-lessonM.json (for example module5-lesson6.json).
 *
 * seedLearning.js calls mergeExtraLessons(), which adds every file
 * whose lesson number is higher than the lessons that module already
 * has in moneyBasics.new.js. Nothing needs to be listed here.
 *
 * Check without touching the database:
 *   node scripts/learningData/extraLessons.js
 */

const fs = require('fs');
const path = require('path');

const COURSES = {
  'money-basics': {
    dir: path.join(__dirname, '..', '..', 'content', 'money-basics'),
    pattern: /^module(\d+)-lesson(\d+)\.json$/
  }
};

function readLessonFile(dir, file) {
  let raw;

  try {
    raw = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
  } catch (error) {
    throw new Error(`${file} is not valid JSON: ${error.message}`);
  }

  const src =
    raw && raw.lesson && typeof raw.lesson === 'object' ? raw.lesson : raw;
  const keys = Object.keys(src || {}).join(', ');
  const blocks = src.contentBlocks || src.blocks;
  const rawQuiz = src.quizzes || src.quiz || raw.quizzes || raw.quiz;

  if (!src.slug || !src.title) {
    throw new Error(`${file} needs a slug and a title. Keys found: ${keys}`);
  }

  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error(`${file} has no contentBlocks. Keys found: ${keys}`);
  }

  if (!Array.isArray(rawQuiz) || rawQuiz.length === 0) {
    throw new Error(`${file} has no quiz questions. Keys found: ${keys}`);
  }

  const quizzes = rawQuiz.map((item, index) => {
    const quiz = { ...item };

    if (quiz.order === undefined) {
      quiz.order = index + 1;
    }

    if (!quiz.questionType) {
      const trueFalse =
        Array.isArray(quiz.options) &&
        quiz.options.length === 2 &&
        /^true$/i.test(String(quiz.options[0]));

      quiz.questionType = trueFalse ? 'true-false' : 'multiple-choice';
    }

    if (
      !quiz.question ||
      !Array.isArray(quiz.options) ||
      quiz.correctAnswer === undefined ||
      !quiz.explanation
    ) {
      throw new Error(
        `${file}: quiz question ${index + 1} is missing a question, options, correctAnswer or explanation.`
      );
    }

    return quiz;
  });

  return {
    slug: src.slug,
    title: src.title,
    description: src.description || src.title,
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
    const config = COURSES[data && data.course && data.course.slug];

    if (!config || !fs.existsSync(config.dir)) {
      continue;
    }

    // How many lessons each module already has in the main data file.
    const baseCount = new Map(
      data.modules.map((item) => [item.order, item.lessons.length])
    );

    const files = fs
      .readdirSync(config.dir)
      .map((file) => {
        const match = file.match(config.pattern);
        return match
          ? { file, moduleNo: Number(match[1]), lessonNo: Number(match[2]) }
          : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.moduleNo - b.moduleNo || a.lessonNo - b.lessonNo);

    for (const { file, moduleNo, lessonNo } of files) {
      if (!baseCount.has(moduleNo)) {
        console.warn(
          `WARNING: ${file} skipped. Module ${moduleNo} does not exist in the course data.`
        );
        continue;
      }

      if (lessonNo <= baseCount.get(moduleNo)) {
        continue;
      }

      const targetModule = data.modules.find((item) => item.order === moduleNo);
      const lesson = readLessonFile(config.dir, file);

      if (targetModule.lessons.some((item) => item.slug === lesson.slug)) {
        console.log(`Extra lesson already in course data, skipped: ${lesson.slug}`);
        continue;
      }

      const taken = new Set(targetModule.lessons.map((item) => item.order));
      let order = Number(lesson.order);

      if (!Number.isInteger(order) || taken.has(order)) {
        order = Math.max(0, ...taken) + 1;
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
      console.log(`Module ${item.order} ${item.slug}: ${item.lessons.length} lessons`);
    }

    console.log(`Total lessons: ${total}`);
  }
}
                                    
