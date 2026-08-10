require('dotenv').config();
const mongoose = require('mongoose');

// Define a simple Course schema matching your backend model
const courseSchema = new mongoose.Schema({
    title: String,
    description: String,
    category: String,
    modules: Array
});

const Course = mongoose.model('Course', courseSchema);

async function seedDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB for seeding...');

        // Clear existing courses to prevent duplicates
        await Course.deleteMany({});

        // Add real initial data
        const sampleCourses = [
            {
                title: "Introduction to Crypto & Finance",
                description: "Learn the fundamentals of traditional and digital assets.",
                category: "Finance",
                modules: [
                    { title: "Understanding Compound Interest", content: "Compound interest is the addition of interest to the principal sum of a loan or deposit." }
                ]
            }
        ];

        await Course.insertMany(sampleCourses);
        console.log('Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
}

seedDB();
