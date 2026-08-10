require('dotenv').config();
const mongoose = require('mongoose');
const Course = require('./models/Course');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/xylotix';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear any old test data
    await Course.deleteMany({});
    console.log('Cleared old courses.');

    // Create a real course record
    const newCourse = new Course({
      title: "Money Basics",
      category: "Personal Finance",
      description: "Master the fundamentals of budgeting, saving, and understanding income.",
      modules: [
        {
          title: "Module 1: Saving & Growth",
          order: 1,
          lessons: [
            {
              title: "Understanding Compound Interest",
              content: "Compound interest is when you earn interest on both the money you've saved and the interest you earn. If you save ₦10,000 and it grows over time, your growth itself starts earning growth!",
              durationMinutes: 5,
              order: 1,
              quiz: {
                question: "If you save ₦10,000 and it grows over time, what happens when the growth itself starts earning growth?",
                options: ["Nothing", "The growth can compound", "Your money disappears"],
                correctAnswerIndex: 1
              }
            }
          ]
        }
      ]
    });

    await newCourse.save();
    console.log('Success! Real course data inserted into Xylotix Database.');
    
    process.exit(); // Close the script
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
}

seedDatabase();
