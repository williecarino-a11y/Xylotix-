const Course = require('../models/Course');
const Module = require('../models/Module');
const Lesson = require('../models/Lesson');
const Quiz = require('../models/Quiz');
const UserProgress = require('../models/UserProgress');

class LearningService {
  // Fetch all published courses with loading/empty handling support at the controller level
  async getAllCourses() {
    return await Course.find({ published: true }).sort({ order: 1 });
  }

  // Get full course tree: Course -> Modules -> Lessons
  async getCourseDetails(courseId) {
    const course = await Course.findById(courseId);
    if (!course) throw new Error('Course not found');

    const modules = await Module.find({ courseId }).sort({ order: 1 });
    const moduleIds = modules.map(m => m._id);
    const lessons = await Lesson.find({ moduleId: { $in: moduleIds }, published: true }).sort({ order: 1 });

    // Structure relationships dynamically
    const structuredModules = modules.map(mod => ({
      ...mod.toObject(),
      lessons: lessons.filter(l => l.moduleId.toString() === mod._id.toString())
    }));

    return {
      ...course.toObject(),
      modules: structuredModules
    };
  }

  // Get single lesson details with its quiz
  async getLessonWithQuiz(lessonId) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new Error('Lesson not found');

    const quiz = await Quiz.find({ lessonId });
    return { lesson, quiz };
  }

  // Record progress, evaluate quiz score, and automatically update state (Rule 15)
  async recordLessonProgress(userId, lessonId, submittedAnswers) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) throw new Error('Lesson not found');

    // Evaluate quiz if questions exist for this lesson
    const quizzes = await Quiz.find({ lessonId });
    let score = null;

    if (quizzes.length > 0 && submittedAnswers) {
      let correctCount = 0;
      quizzes.forEach((q, index) => {
        if (submittedAnswers[index] === q.correctAnswer) {
          correctCount++;
        }
      });
      score = Math.round((correctCount / quizzes.length) * 100);
    }

    // Update or create persistent progress (Single Source of Truth)
    const progress = await UserProgress.findOneAndUpdate(
      { userId, lessonId },
      {
        completed: true,
        quizScore: score,
        completedAt: new Date()
      },
      { new: true, upsert: true }
    );

    return {
      success: true,
      progress,
      message: 'Lesson progress recorded successfully'
    };
  }

  // Dynamically derive overall dashboard statistics from underlying user activity (Rule 8)
  async getUserDashboardStats(userId) {
    const allProgress = await UserProgress.find({ userId, completed: true });
    const totalLessonsCompleted = allProgress.length;
    
    // Calculate average quiz score from attempted quizzes
    const scoredQuizzes = allProgress.filter(p => p.quizScore !== null);
    const averageQuizScore = scoredQuizzes.length > 0
      ? Math.round(scoredQuizzes.reduce((acc, curr) => acc + curr.quizScore, 0) / scoredQuizzes.length)
      : 0;

    // Derive learning streak from completion dates
    const streak = this.calculateStreak(allProgress);

    return {
      totalLessonsCompleted,
      averageQuizScore,
      streak,
      totalXP: totalLessonsCompleted * 50 // Example XP derivation logic
    };
  }

  calculateStreak(progressRecords) {
    if (progressRecords.length === 0) return 0;
    // Streak derivation logic based on unique active dates
    const uniqueDates = [...new Set(progressRecords.map(p => new Date(p.completedAt).toDateString()))];
    return uniqueDates.length; // Simplified dynamic calculation
  }
}

module.exports = new LearningService();
