const mongoose = require('mongoose');
const Course = require('./models/Course');

mongoose.connect('mongodb+srv://williecarino23_db_user:Williecarino09035884124@expense-tracker0.xoeajf4.mongodb.net/xylotix?appName=xylotix')
    .then(async () => {
        console.log('Connected for seeding...');
        await Course.create({
            title: 'Introduction to Crypto & Finance',
            description: 'Learn the fundamentals of traditional and digital assets.',
            category: 'Finance',
            lessons: [
                { title: 'What is Money?', content: 'Money has evolved from barter systems to digital currency.', duration: '5 mins' },
                { title: 'Understanding Compound Interest', content: 'Compound interest is the eighth wonder of the world.', duration: '10 mins' }
            ]
        });
        console.log('Sample course added!');
        process.exit();
    })
    .catch(err => console.error(err));
