from pathlib import Path
import re

path = Path("public/index.html")
text = path.read_text()

# Existing runtime strings -> existing translation keys
replacements = {
    'There is no quiz available for this lesson.':
        '${miimiidTranslate("noQuizAvailable", getSavedLanguage())}',

    'Please answer all the questions before submitting.':
        '${miimiidTranslate("answerAllQuestions", getSavedLanguage())}',

    'Unable to connect to the server.':
        '${miimiidTranslate("unableToConnect", getSavedLanguage())}',
}

for old, new in replacements.items():
    text = text.replace(old, new)

# Add missing keys to every translation object.
# English fallback values are intentionally used for all languages
# until proper translations are added.
new_keys = {
    "untitledLesson": "Untitled Lesson",
    "noLessonContent": "No lesson content available.",
    "questionUnavailable": "Question unavailable.",
    "unsupportedQuestionType": "Unsupported question type:",
}

# Language blocks are identified by their object declarations.
# Insert the keys immediately after the opening `{`.
pattern = re.compile(
    r'(?m)^(\s{4})([a-z]{2}): \{\n'
)

def add_keys(match):
    indent = match.group(1)
    lang = match.group(2)
    start = match.end()

    # Find the next portion of this language object.
    # If the first key already exists, don't add duplicates.
    block_end = text.find("\n    },", start)
    if block_end == -1:
        return match.group(0)

    block = text[start:block_end]

    missing = [
        f'      {key}: {value!r},'
        for key, value in new_keys.items()
        if re.search(rf'(?m)^\s*{re.escape(key)}:', block) is None
    ]

    if not missing:
        return match.group(0)

    return match.group(0) + "\n" + "\n".join(missing) + "\n"

text = pattern.sub(add_keys, text)

# Replace runtime fallbacks.
text = text.replace(
    'lesson.title ||\n                                      "Untitled Lesson"',
    'lesson.title ||\n                                      miimiidTranslate("untitledLesson", getSavedLanguage())'
)

text = text.replace(
    'targetLesson.title ||\n          "Untitled Lesson"',
    'targetLesson.title ||\n          miimiidTranslate("untitledLesson", getSavedLanguage())'
)

text = text.replace(
    'No lesson content available.',
    '${miimiidTranslate("noLessonContent", getSavedLanguage())}'
)

text = text.replace(
    'Question unavailable.',
    '${miimiidTranslate("questionUnavailable", getSavedLanguage())}'
)

text = text.replace(
    'Unsupported question type:',
    '${miimiidTranslate("unsupportedQuestionType", getSavedLanguage())}'
)

path.write_text(text)
print("Final runtime i18n update completed.")
print("Updated:", path)
