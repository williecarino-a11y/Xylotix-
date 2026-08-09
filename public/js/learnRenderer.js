// Helper function to get token from localStorage (or your existing auth state)
function getToken() {
  return localStorage.getItem('token') || '';
}

// 1. Load Learn Dashboard
async function loadLearnDashboard() {
  if (typeof showLoadingState === 'function') showLoadingState(true);
  if (typeof clearErrorState === 'function') clearErrorState();

  try {
const response = await fetch('/api/learn/courses', {
      headers: { 'Authorization': `Bearer ${getToken()}` }
    });
    
const courses = await response.json();

    if (!courses || courses.length === 0) {
      if (typeof renderEmptyState === 'function') {
        renderEmptyState("No courses available at the moment.");
      }
      return;
    }

    if (typeof renderCourseList === 'function') {
      renderCourseList(courses);
    }
  } catch (error) {
    if (typeof renderErrorState === 'function') {
      renderErrorState("Something went wrong loading your courses. Please try again.");
    }
  } finally {
    if (typeof showLoadingState === 'function') showLoadingState(false);
  }
}

// 2. Load Individual Course Details
async function loadCourseDetails(courseId) {
  try {
    const response = await fetch(`/api/learn/courses/${courseId}`, {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const course = await response.json();

    if (!response.ok) {
      throw new Error(course.message || 'Failed to load course details');
    }

    if (typeof renderCourseDetails === 'function') {
      renderCourseDetails(course);
    }
  } catch (error) {
    if (typeof renderErrorState === 'function') {
      renderErrorState('Failed to load course details. Please try again.');
    }
  }
}

// 3. Handle Lesson Completion & Quiz Submission
async function handleCompleteLesson(lessonId, selectedAnswerIndex) {
  try {
    const response = await fetch(`/api/learn/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({ answerIndex: selectedAnswerIndex })
    });

    const result = await response.json();

    if (!result.success) throw new Error(result.message);

    if (typeof showSuccessToast === 'function') showSuccessToast("Lesson completed successfully!");
    if (typeof updateUserDashboardMetrics === 'function') updateUserDashboardMetrics();
    if (typeof navigateToNextLessonOrDashboard === 'function') navigateToNextLessonOrDashboard();
  } catch (error) {
    if (typeof showErrorToast === 'function') showErrorToast("Failed to save progress.");
  }
}

function renderCourseList(courses) {
const container = document.getElementById('app-container');
  if (!container) return;

  container.innerHTML = '';

  courses.forEach(course => {
    const card = document.createElement('div');
    card.className = 'course-card';
    card.innerHTML = `
      <h3>${course.title}</h3>
      <p>${course.description}</p>
      <span>Category: ${course.category}</span>
    `;
    card.onclick = () => loadCourseDetails(course._id || course.id);
    container.appendChild(card);
  });
}
