const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('./models/Course'); // Adjust path to your Course model if needed

async function updateMoneyBasics() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/xylotix');
    console.log('Connected to MongoDB');

    const updatedModules = [
      {
        title: "Saving & Growth",
        lessons: [
          {
            title: "Understanding Compound Interest",
            content: "Compound interest is when you earn interest on both the money you've saved and the interest you earn. If you save ₦10,000 and it grows over time, your growth itself starts earning growth!",
            quiz: {
              question: "If you save ₦10,000 and it grows over time, what happens when the growth itself starts earning growth?",
              options: ["Nothing", "The growth can compound", "Your money disappears"],
              correctAnswerIndex: 1
            }
          },
          {
            title: "The Power of Emergency Funds",
            content: "An emergency fund acts as a financial safety net. Having 3 to 6 months of living expenses saved protects you from unexpected job loss, medical bills, or major repairs without going into debt.",
            quiz: {
              question: "How many months of living expenses should a standard emergency fund ideally cover?",
              options: ["1 week", "3 to 6 months", "10 years"],
              correctAnswerIndex: 1
            }
          }
        ]
      },
      {
        title: "Budgeting Fundamentals",
        lessons: [
          {
            title: "The 50/30/20 Rule",
            content: "The 50/30/20 rule is a popular budgeting framework. Allocate 50% of your income to needs (rent, food), 30% to wants (entertainment, dining out), and 20% to savings and debt repayment.",
            quiz: {
              question: "In the 50/30/20 budget framework, what percentage of income is recommended for savings and investments?",
              options: ["50%", "30%", "20%"],
              correctAnswerIndex: 2
            }
          },
          {
            title: "Tracking Daily Expenses",
            content: "Small, unnoticed daily expenses like subscription fees or impulse purchases can drain your bank account over time. Tracking every naira helps you spot wasteful spending habits.",
            quiz: {
              question: "Why is tracking small daily expenses important?",
              options: ["To find and eliminate hidden money drains", "To decrease your income", "It is completely useless"],
              correctAnswerIndex: 0
            }
          }
        ]
      },
      {
        title: "Understanding Income & Cash Flow",
        lessons: [
          {
            title: "Active vs. Passive Income",
            content: "Active income requires your direct labor and time (like a 9-to-5 job or freelance gig). Passive income comes from assets requiring minimal effort to maintain once set up, such as dividend-paying stocks or automated rental income.",
            quiz: {
              question: "Which of the following best describes passive income?",
              options: ["Working hourly shifts", "Income generated from assets with minimal ongoing labor", "Borrowing money from a bank"],
              correctAnswerIndex: 1
            }
          }
        ]
      }
    ];

    // Find and update the Money Basics course
    const result = await Course.findOneAndUpdate(
      { title: { $regex: /Money Basics/i } },
      { $set: { modules: updatedModules } },
      { new: true, upsert: true }
    );

    console.log('Successfully updated course:', result.title);
    process.exit(0);
  } catch (err) {
    console.error('Error updating course:', err);
    process.exit(1);
  }
}

updateMoneyBasics();
