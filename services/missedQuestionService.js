const MissedQuestion = require('../models/MissedQuestion');

// results looks like [{ quizId, correct }] from learningService.submitQuizAnswers
async function recordResults(userId, lessonId, results) {
  if (!Array.isArray(results) || !results.length) return;

  const now = new Date();
  const operations = [];

  results.forEach(function (item) {
    if (!item || !item.quizId) return;

    if (item.correct) {
      operations.push({
        deleteOne: { filter: { userId, quizId: item.quizId } }
      });
    } else {
      operations.push({
        updateOne: {
          filter: { userId, quizId: item.quizId },
          update: {
            $set: { lessonId, lastMissedAt: now },
            $inc: { missCount: 1 }
          },
          upsert: true
        }
      });
    }
  });

  if (operations.length) {
    await MissedQuestion.bulkWrite(operations, { ordered: false });
  }
}

module.exports = { recordResults };
