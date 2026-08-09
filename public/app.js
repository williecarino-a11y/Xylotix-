document.addEventListener('DOMContentLoaded', () => {
    loadLearnContent();
});

// 1. Load all courses from the database
async function loadLearnContent() {
    const container = document.getElementById('learn-container') || document.body;
    container.innerHTML = '<div class="loading-state">Loading courses from database...</div>';

    try {
        const response = await fetch('/api/learn/courses');
        if (!response.ok) throw new Error('Failed to fetch from server');

        const courses = await response.json();

        if (courses.length === 0) {
            container.innerHTML = '<div class="empty-state">No courses available yet.</div>';
            return;
        }

        container.innerHTML = courses.map(course => `
            <div class="course-card" onclick="openCourse('${course._id}')">
                <h3>${course.title}</h3>
                <p>${course.description}</p>
                <span>Category: ${course.category}</span>
            </div>
        `).join('');

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="error-state">Something went wrong. Please try again.</div>';
    }
}

// 2. Open an individual course and list its lessons
async function openCourse(courseId) {
    const container = document.getElementById('learn-container') || document.body;
    container.innerHTML = '<div class="loading-state">Loading lessons...</div>';

    try {
        const response = await fetch(`/api/learn/courses/${courseId}`);
        if (!response.ok) throw new Error('Failed to fetch course details');
        
        const course = await response.json();

        container.innerHTML = `
            <button class="back-btn" onclick="loadLearnContent()">← Back to Courses</button>
            <div class="course-detail-header">
                <h2>${course.title}</h2>
                <p>${course.description}</p>
                <span class="category-badge">${course.category}</span>
            </div>
            <div class="lessons-list">
                <h3>Lessons</h3>
                ${course.lessons.map((lesson, index) => `
                    <div class="lesson-card">
                        <span>Module ${index + 1}: ${lesson.title}</span>
                        <span class="lesson-duration">${lesson.duration || ''}</span>
                        <button class="action-btn" onclick="startLesson('${course._id}', '${lesson._id}')">Start Lesson</button>
                    </div>
                `).join('')}
            </div>
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="error-state">Failed to load course details. Please try again.</div>';
    }
}

// 3. Start an individual lesson
async function startLesson(courseId, lessonId) {
    const container = document.getElementById('learn-container') || document.body;
    container.innerHTML = '<div class="loading-state">Loading lesson content...</div>';

    try {
        const response = await fetch(`/api/learn/courses/${courseId}/lessons/${lessonId}`);
        if (!response.ok) throw new Error('Failed to fetch lesson');

        const lesson = await response.json();

        container.innerHTML = `
            <button class="back-btn" onclick="openCourse('${courseId}')">← Back to Course</button>
            <div class="lesson-view">
                <h2>${lesson.title}</h2>
                <div class="lesson-body">
                    <p>${lesson.content || 'Interactive lesson content goes here.'}</p>
                </div>
                <button class="action-btn complete-btn" onclick="completeLesson('${courseId}', '${lesson._id}')">Complete Lesson & Continue</button>
            </div>
        `;
    } catch (err) {
        console.error(err);
        container.innerHTML = '<div class="error-state">Failed to load lesson. Please try again.</div>';
    }
}

async function completeLesson(courseId, lessonId) {
    try {
        const response = await fetch('/api/learn/progress', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: 'default-user', courseId, lessonId })
        });
        const data = await response.json();
        if (response.ok) {
            alert('Progress saved successfully!');
            openCourse(courseId);
        } else {
            alert(data.error || 'Failed to save progress');
        }
    } catch (err) {
        console.error('Error saving progress:', err);
    }
}
