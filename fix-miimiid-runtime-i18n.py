from pathlib import Path

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

old = """        result.innerHTML = `
          <span class="success-text">
            Quiz complete!
            Score: ${quizResult.score}%.
            You got
            ${quizResult.correctAnswers}
            out of
            ${quizResult.totalQuestions}
            correct.
            You can now complete the lesson.
          </span>
        `;"""

new = """        result.innerHTML = `
          <span class="success-text">
            ${miimiidTranslate("quizComplete", getSavedLanguage())}
            ${miimiidTranslate("score", getSavedLanguage())}: ${quizResult.score}%.
            ${miimiidTranslate("youGot", getSavedLanguage())}
            ${quizResult.correctAnswers}
            ${miimiidTranslate("outOf", getSavedLanguage())}
            ${quizResult.totalQuestions}
            ${miimiidTranslate("correct", getSavedLanguage())}
            ${miimiidTranslate("canCompleteLesson", getSavedLanguage())}
          </span>
        `;"""

if old not in text:
    raise SystemExit("ERROR: Success quiz-result block was not found.")

text = text.replace(old, new, 1)

old = """        result.innerHTML = `
          <span class="error-text">
            Score: ${quizResult.score}%.
            You got
            ${quizResult.correctAnswers}
            out of
            ${quizResult.totalQuestions}
            correct.
            Review the lesson and try again.
          </span>
        `;"""

new = """        result.innerHTML = `
          <span class="error-text">
            ${miimiidTranslate("score", getSavedLanguage())}: ${quizResult.score}%.
            ${miimiidTranslate("youGot", getSavedLanguage())}
            ${quizResult.correctAnswers}
            ${miimiidTranslate("outOf", getSavedLanguage())}
            ${quizResult.totalQuestions}
            ${miimiidTranslate("correct", getSavedLanguage())}
            ${miimiidTranslate("reviewLessonTryAgain", getSavedLanguage())}
          </span>
        `;"""

if old not in text:
    raise SystemExit("ERROR: Failed quiz-result block was not found.")

text = text.replace(old, new, 1)

old = """    document.getElementById("quiz-result").innerHTML =
      '<span class="error-text">No lesson is currently selected.</span>';"""

new = """    document.getElementById("quiz-result").innerHTML =
      `<span class="error-text">${miimiidTranslate("noLessonSelected", getSavedLanguage())}</span>`;"""

if old not in text:
    raise SystemExit("ERROR: No-lesson-selected block was not found.")

text = text.replace(old, new, 1)

old = """    document.getElementById("quiz-result").innerHTML =
      '<span class="error-text">Please complete and submit the quiz before completing this lesson.</span>';"""

new = """    document.getElementById("quiz-result").innerHTML =
      `<span class="error-text">${miimiidTranslate("completeQuizBeforeLesson", getSavedLanguage())}</span>`;"""

if old not in text:
    raise SystemExit("ERROR: Complete-quiz-before-lesson block was not found.")

text = text.replace(old, new, 1)

# Add the two missing English source keys immediately after reviewLessonTryAgain.
needle = """      reviewLessonTryAgain: 'Review the lesson and try again.',
"""

replacement = """      reviewLessonTryAgain: "Review the lesson and try again.",
      noLessonSelected: "No lesson is currently selected.",
      completeQuizBeforeLesson: "Please complete and submit the quiz before completing this lesson.",
"""

if needle not in text:
    raise SystemExit("ERROR: English reviewLessonTryAgain key was not found.")

text = text.replace(needle, replacement, 1)

# Add Spanish translations for the same keys, plus the missing "correct" key.
needle = """      reviewLessonTryAgain: 'Repasa la lección e inténtalo de nuevo.',
"""

replacement = """      reviewLessonTryAgain: 'Repasa la lección e inténtalo de nuevo.',
      correct: 'correctas.',
      noLessonSelected: 'No hay ninguna lección seleccionada.',
      completeQuizBeforeLesson: 'Completa y envía el cuestionario antes de completar esta lección.',
"""

if needle not in text:
    raise SystemExit("ERROR: Spanish reviewLessonTryAgain key was not found.")

text = text.replace(needle, replacement, 1)

path.write_text(text, encoding="utf-8")
print("Miimiid runtime i18n update completed.")
print("Updated: public/index.html")
