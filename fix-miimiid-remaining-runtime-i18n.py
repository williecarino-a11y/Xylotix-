from pathlib import Path
import re

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

# ------------------------------------------------------------
# 1. Add missing English translation keys
# ------------------------------------------------------------

english = {
    "noLessonContent": "No lesson content available.",
    "untitledLesson": "Untitled Lesson",
    "unsupportedQuestionType": "Unsupported question type:",
    "noQuizAvailable": "There is no quiz available for this lesson.",
    "answerAllQuestions": "Please answer all the questions before submitting.",
    "unableToConnectServer": "Unable to connect to the server.",
    "lessonsCompletedProgress": "lessons completed",
    "moduleLabel": "Module",
    "lessonLabel": "Lesson",
    "ofLabel": "of",
    "minutesShort": "min",
}

# Insert only if the key does not already exist in the English block.
en_start = text.find("    en: {")
if en_start == -1:
    raise SystemExit("ERROR: English translation block not found.")

next_lang = text.find("\n    es: {", en_start)
if next_lang == -1:
    raise SystemExit("ERROR: Spanish translation block not found.")

en_block = text[en_start:next_lang]

insert_after = "      lessonNotFound: 'Lesson not found.',"

for key, value in english.items():
    if re.search(rf"^\s*{re.escape(key)}\s*:", en_block, re.MULTILINE):
        continue

    match = re.search(
        re.escape(insert_after),
        en_block
    )

    if not match:
        raise SystemExit(
            f"ERROR: Could not find insertion point for {key}."
        )

    addition = f"\n      {key}: {value!r},"

    absolute_pos = en_start + match.end()
    text = text[:absolute_pos] + addition + text[absolute_pos:]

    en_block = text[en_start:next_lang]

# ------------------------------------------------------------
# 2. Translation values for every supported language
# ------------------------------------------------------------

translations = {
    "en": {
        "noLessonContent": "No lesson content available.",
        "untitledLesson": "Untitled Lesson",
        "unsupportedQuestionType": "Unsupported question type:",
        "noQuizAvailable": "There is no quiz available for this lesson.",
        "answerAllQuestions": "Please answer all the questions before submitting.",
        "unableToConnectServer": "Unable to connect to the server.",
        "lessonsCompletedProgress": "lessons completed",
        "moduleLabel": "Module",
        "lessonLabel": "Lesson",
        "ofLabel": "of",
        "minutesShort": "min",
    },
    "es": {
        "noLessonContent": "No hay contenido disponible para esta lección.",
        "untitledLesson": "Lección sin título",
        "unsupportedQuestionType": "Tipo de pregunta no compatible:",
        "noQuizAvailable": "No hay ningún cuestionario disponible para esta lección.",
        "answerAllQuestions": "Responde todas las preguntas antes de enviar.",
        "unableToConnectServer": "No se pudo conectar con el servidor.",
        "lessonsCompletedProgress": "lecciones completadas",
        "moduleLabel": "Módulo",
        "lessonLabel": "Lección",
        "ofLabel": "de",
        "minutesShort": "min",
    },
    "fr": {
        "noLessonContent": "Aucun contenu de leçon disponible.",
        "untitledLesson": "Leçon sans titre",
        "unsupportedQuestionType": "Type de question non pris en charge :",
        "noQuizAvailable": "Aucun quiz n'est disponible pour cette leçon.",
        "answerAllQuestions": "Répondez à toutes les questions avant d'envoyer.",
        "unableToConnectServer": "Impossible de se connecter au serveur.",
        "lessonsCompletedProgress": "leçons terminées",
        "moduleLabel": "Module",
        "lessonLabel": "Leçon",
        "ofLabel": "sur",
        "minutesShort": "min",
    },
    "de": {
        "noLessonContent": "Für diese Lektion ist kein Inhalt verfügbar.",
        "untitledLesson": "Lektion ohne Titel",
        "unsupportedQuestionType": "Nicht unterstützter Fragetyp:",
        "noQuizAvailable": "Für diese Lektion ist kein Quiz verfügbar.",
        "answerAllQuestions": "Beantworte alle Fragen, bevor du sie abschickst.",
        "unableToConnectServer": "Verbindung zum Server nicht möglich.",
        "lessonsCompletedProgress": "Lektionen abgeschlossen",
        "moduleLabel": "Modul",
        "lessonLabel": "Lektion",
        "ofLabel": "von",
        "minutesShort": "Min.",
    },
    "pt": {
        "noLessonContent": "Nenhum conteúdo de lição disponível.",
        "untitledLesson": "Lição sem título",
        "unsupportedQuestionType": "Tipo de pergunta não suportado:",
        "noQuizAvailable": "Não há questionário disponível para esta lição.",
        "answerAllQuestions": "Responda a todas as perguntas antes de enviar.",
        "unableToConnectServer": "Não foi possível conectar ao servidor.",
        "lessonsCompletedProgress": "lições concluídas",
        "moduleLabel": "Módulo",
        "lessonLabel": "Lição",
        "ofLabel": "de",
        "minutesShort": "min",
    },
    "it": {
        "noLessonContent": "Nessun contenuto disponibile per questa lezione.",
        "untitledLesson": "Lezione senza titolo",
        "unsupportedQuestionType": "Tipo di domanda non supportato:",
        "noQuizAvailable": "Non è disponibile alcun quiz per questa lezione.",
        "answerAllQuestions": "Rispondi a tutte le domande prima di inviare.",
        "unableToConnectServer": "Impossibile connettersi al server.",
        "lessonsCompletedProgress": "lezioni completate",
        "moduleLabel": "Modulo",
        "lessonLabel": "Lezione",
        "ofLabel": "di",
        "minutesShort": "min",
    },
    "nl": {
        "noLessonContent": "Geen lesinhoud beschikbaar.",
        "untitledLesson": "Les zonder titel",
        "unsupportedQuestionType": "Niet-ondersteund vraagtype:",
        "noQuizAvailable": "Er is geen quiz beschikbaar voor deze les.",
        "answerAllQuestions": "Beantwoord alle vragen voordat je ze indient.",
        "unableToConnectServer": "Kan geen verbinding maken met de server.",
        "lessonsCompletedProgress": "lessen voltooid",
        "moduleLabel": "Module",
        "lessonLabel": "Les",
        "ofLabel": "van",
        "minutesShort": "min.",
    },
    "pl": {
        "noLessonContent": "Brak dostępnej treści lekcji.",
        "untitledLesson": "Lekcja bez tytułu",
        "unsupportedQuestionType": "Nieobsługiwany typ pytania:",
        "noQuizAvailable": "Dla tej lekcji nie ma dostępnego quizu.",
        "answerAllQuestions": "Odpowiedz na wszystkie pytania przed wysłaniem.",
        "unableToConnectServer": "Nie można połączyć się z serwerem.",
        "lessonsCompletedProgress": "ukończonych lekcji",
        "moduleLabel": "Moduł",
        "lessonLabel": "Lekcja",
        "ofLabel": "z",
        "minutesShort": "min",
    },
    "tr": {
        "noLessonContent": "Bu ders için içerik mevcut değil.",
        "untitledLesson": "Başlıksız Ders",
        "unsupportedQuestionType": "Desteklenmeyen soru türü:",
        "noQuizAvailable": "Bu ders için kullanılabilir bir test yok.",
        "answerAllQuestions": "Göndermeden önce tüm soruları cevaplayın.",
        "unableToConnectServer": "Sunucuya bağlanılamıyor.",
        "lessonsCompletedProgress": "ders tamamlandı",
        "moduleLabel": "Modül",
        "lessonLabel": "Ders",
        "ofLabel": "/",
        "minutesShort": "dk",
    },
    "ru": {
        "noLessonContent": "Содержимое урока недоступно.",
        "untitledLesson": "Урок без названия",
        "unsupportedQuestionType": "Неподдерживаемый тип вопроса:",
        "noQuizAvailable": "Для этого урока нет доступного теста.",
        "answerAllQuestions": "Ответьте на все вопросы перед отправкой.",
        "unableToConnectServer": "Не удалось подключиться к серверу.",
        "lessonsCompletedProgress": "уроков завершено",
        "moduleLabel": "Модуль",
        "lessonLabel": "Урок",
        "ofLabel": "из",
        "minutesShort": "мин",
    },
    "uk": {
        "noLessonContent": "Вміст уроку недоступний.",
        "untitledLesson": "Урок без назви",
        "unsupportedQuestionType": "Непідтримуваний тип запитання:",
        "noQuizAvailable": "Для цього уроку немає доступного тесту.",
        "answerAllQuestions": "Відповідайте на всі запитання перед надсиланням.",
        "unableToConnectServer": "Не вдалося підключитися до сервера.",
        "lessonsCompletedProgress": "уроків завершено",
        "moduleLabel": "Модуль",
        "lessonLabel": "Урок",
        "ofLabel": "із",
        "minutesShort": "хв",
    },
    "ar": {
        "noLessonContent": "لا يوجد محتوى متاح لهذا الدرس.",
        "untitledLesson": "درس بلا عنوان",
        "unsupportedQuestionType": "نوع السؤال غير مدعوم:",
        "noQuizAvailable": "لا يوجد اختبار متاح لهذا الدرس.",
        "answerAllQuestions": "يرجى الإجابة عن جميع الأسئلة قبل الإرسال.",
        "unableToConnectServer": "تعذر الاتصال بالخادم.",
        "lessonsCompletedProgress": "دروس مكتملة",
        "moduleLabel": "الوحدة",
        "lessonLabel": "الدرس",
        "ofLabel": "من",
        "minutesShort": "دقيقة",
    },
    "he": {
        "noLessonContent": "אין תוכן זמין לשיעור זה.",
        "untitledLesson": "שיעור ללא כותרת",
        "unsupportedQuestionType": "סוג שאלה שאינו נתמך:",
        "noQuizAvailable": "אין שאלון זמין לשיעור זה.",
        "answerAllQuestions": "ענה על כל השאלות לפני השליחה.",
        "unableToConnectServer": "לא ניתן להתחבר לשרת.",
        "lessonsCompletedProgress": "שיעורים שהושלמו",
        "moduleLabel": "מודול",
        "lessonLabel": "שיעור",
        "ofLabel": "מתוך",
        "minutesShort": "דק׳",
    },
    "fa": {
        "noLessonContent": "محتوایی برای این درس موجود نیست.",
        "untitledLesson": "درس بدون عنوان",
        "unsupportedQuestionType": "نوع سؤال پشتیبانی نمی‌شود:",
        "noQuizAvailable": "آزمونی برای این درس موجود نیست.",
        "answerAllQuestions": "لطفاً قبل از ارسال به همه سؤالات پاسخ دهید.",
        "unableToConnectServer": "اتصال به سرور ممکن نیست.",
        "lessonsCompletedProgress": "درس تکمیل‌شده",
        "moduleLabel": "ماژول",
        "lessonLabel": "درس",
        "ofLabel": "از",
        "minutesShort": "دقیقه",
    },
    "hi": {
        "noLessonContent": "इस पाठ के लिए कोई सामग्री उपलब्ध नहीं है।",
        "untitledLesson": "शीर्षक रहित पाठ",
        "unsupportedQuestionType": "असमर्थित प्रश्न प्रकार:",
        "noQuizAvailable": "इस पाठ के लिए कोई क्विज़ उपलब्ध नहीं है।",
        "answerAllQuestions": "जमा करने से पहले सभी प्रश्नों के उत्तर दें।",
        "unableToConnectServer": "सर्वर से कनेक्ट नहीं हो सका।",
        "lessonsCompletedProgress": "पाठ पूरे हुए",
        "moduleLabel": "मॉड्यूल",
        "lessonLabel": "पाठ",
        "ofLabel": "में से",
        "minutesShort": "मिनट",
    },
    "bn": {
        "noLessonContent": "এই পাঠের জন্য কোনো বিষয়বস্তু পাওয়া যায়নি।",
        "untitledLesson": "শিরোনামহীন পাঠ",
        "unsupportedQuestionType": "অসমর্থিত প্রশ্নের ধরন:",
        "noQuizAvailable": "এই পাঠের জন্য কোনো কুইজ পাওয়া যায়নি।",
        "answerAllQuestions": "জমা দেওয়ার আগে সব প্রশ্নের উত্তর দিন।",
        "unableToConnectServer": "সার্ভারের সাথে সংযোগ করা যায়নি।",
        "lessonsCompletedProgress": "টি পাঠ সম্পন্ন",
        "moduleLabel": "মডিউল",
        "lessonLabel": "পাঠ",
        "ofLabel": "এর মধ্যে",
        "minutesShort": "মিনিট",
    },
    "ur": {
        "noLessonContent": "اس سبق کے لیے کوئی مواد دستیاب نہیں ہے۔",
        "untitledLesson": "بلا عنوان سبق",
        "unsupportedQuestionType": "غیر معاون سوال کی قسم:",
        "noQuizAvailable": "اس سبق کے لیے کوئی کوئز دستیاب نہیں ہے۔",
        "answerAllQuestions": "جمع کرانے سے پہلے تمام سوالات کے جواب دیں۔",
        "unableToConnectServer": "سرور سے رابطہ نہیں ہو سکا۔",
        "lessonsCompletedProgress": "اسباق مکمل",
        "moduleLabel": "ماڈیول",
        "lessonLabel": "سبق",
        "ofLabel": "میں سے",
        "minutesShort": "منٹ",
    },
    "id": {
        "noLessonContent": "Tidak ada konten pelajaran yang tersedia.",
        "untitledLesson": "Pelajaran Tanpa Judul",
        "unsupportedQuestionType": "Jenis pertanyaan tidak didukung:",
        "noQuizAvailable": "Tidak ada kuis yang tersedia untuk pelajaran ini.",
        "answerAllQuestions": "Jawab semua pertanyaan sebelum mengirim.",
        "unableToConnectServer": "Tidak dapat terhubung ke server.",
        "lessonsCompletedProgress": "pelajaran selesai",
        "moduleLabel": "Modul",
        "lessonLabel": "Pelajaran",
        "ofLabel": "dari",
        "minutesShort": "mnt",
    },
    "ms": {
        "noLessonContent": "Tiada kandungan pelajaran tersedia.",
        "untitledLesson": "Pelajaran Tanpa Tajuk",
        "unsupportedQuestionType": "Jenis soalan tidak disokong:",
        "noQuizAvailable": "Tiada kuiz tersedia untuk pelajaran ini.",
        "answerAllQuestions": "Jawab semua soalan sebelum menghantar.",
        "unableToConnectServer": "Tidak dapat menyambung ke pelayan.",
        "lessonsCompletedProgress": "pelajaran selesai",
        "moduleLabel": "Modul",
        "lessonLabel": "Pelajaran",
        "ofLabel": "daripada",
        "minutesShort": "min",
    },
    "vi": {
        "noLessonContent": "Không có nội dung bài học.",
        "untitledLesson": "Bài học chưa có tiêu đề",
        "unsupportedQuestionType": "Loại câu hỏi không được hỗ trợ:",
        "noQuizAvailable": "Không có bài kiểm tra cho bài học này.",
        "answerAllQuestions": "Hãy trả lời tất cả câu hỏi trước khi gửi.",
        "unableToConnectServer": "Không thể kết nối với máy chủ.",
        "lessonsCompletedProgress": "bài học đã hoàn thành",
        "moduleLabel": "Mô-đun",
        "lessonLabel": "Bài học",
        "ofLabel": "trên",
        "minutesShort": "phút",
    },
    "th": {
        "noLessonContent": "ไม่มีเนื้อหาบทเรียน",
        "untitledLesson": "บทเรียนไม่มีชื่อ",
        "unsupportedQuestionType": "ประเภทคำถามที่ไม่รองรับ:",
        "noQuizAvailable": "ไม่มีแบบทดสอบสำหรับบทเรียนนี้",
        "answerAllQuestions": "โปรดตอบคำถามทั้งหมดก่อนส่ง",
        "unableToConnectServer": "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        "lessonsCompletedProgress": "บทเรียนที่เสร็จแล้ว",
        "moduleLabel": "โมดูล",
        "lessonLabel": "บทเรียน",
        "ofLabel": "จาก",
        "minutesShort": "นาที",
    },
    "zh": {
        "noLessonContent": "暂无课程内容。",
        "untitledLesson": "未命名课程",
        "unsupportedQuestionType": "不支持的问题类型：",
        "noQuizAvailable": "本课程暂无测验。",
        "answerAllQuestions": "提交前请回答所有问题。",
        "unableToConnectServer": "无法连接到服务器。",
        "lessonsCompletedProgress": "个课程已完成",
        "moduleLabel": "模块",
        "lessonLabel": "课程",
        "ofLabel": "共",
        "minutesShort": "分钟",
    },
    "ja": {
        "noLessonContent": "このレッスンには利用可能なコンテンツがありません。",
        "untitledLesson": "無題のレッスン",
        "unsupportedQuestionType": "サポートされていない質問タイプ：",
        "noQuizAvailable": "このレッスンには利用可能なクイズがありません。",
        "answerAllQuestions": "送信する前にすべての質問に回答してください。",
        "unableToConnectServer": "サーバーに接続できません。",
        "lessonsCompletedProgress": "レッスン完了",
        "moduleLabel": "モジュール",
        "lessonLabel": "レッスン",
        "ofLabel": "全",
        "minutesShort": "分",
    },
    "ko": {
        "noLessonContent": "이 수업에 사용할 수 있는 콘텐츠가 없습니다.",
        "untitledLesson": "제목 없는 수업",
        "unsupportedQuestionType": "지원되지 않는 질문 유형:",
        "noQuizAvailable": "이 수업에는 사용할 수 있는 퀴즈가 없습니다.",
        "answerAllQuestions": "제출하기 전에 모든 질문에 답하세요.",
        "unableToConnectServer": "서버에 연결할 수 없습니다.",
        "lessonsCompletedProgress": "수업 완료",
        "moduleLabel": "모듈",
        "lessonLabel": "수업",
        "ofLabel": "총",
        "minutesShort": "분",
    },
    "sw": {
        "noLessonContent": "Hakuna maudhui ya somo yanayopatikana.",
        "untitledLesson": "Somo Lisilo na Kichwa",
        "unsupportedQuestionType": "Aina ya swali isiyoungwa mkono:",
        "noQuizAvailable": "Hakuna jaribio linalopatikana kwa somo hili.",
        "answerAllQuestions": "Jibu maswali yote kabla ya kutuma.",
        "unableToConnectServer": "Imeshindikana kuunganisha kwenye seva.",
        "lessonsCompletedProgress": "masomo yamekamilika",
        "moduleLabel": "Moduli",
        "lessonLabel": "Somo",
        "ofLabel": "kati ya",
        "minutesShort": "dak",
    },
    "yo": {
        "noLessonContent": "Ko si akoonu ẹkọ kankan tó wà.",
        "untitledLesson": "Ẹkọ Tí Kò Ní Àkọlé",
        "unsupportedQuestionType": "Irú ìbéèrè tí kò ṣe àtìlẹ́yìn:",
        "noQuizAvailable": "Ko si idanwo tó wà fún ẹkọ yii.",
        "answerAllQuestions": "Jọ̀wọ́ dáhùn gbogbo àwọn ìbéèrè kí o tó fi ránṣẹ́.",
        "unableToConnectServer": "A kò lè sopọ̀ mọ́ olupin.",
        "lessonsCompletedProgress": "ẹkọ ti pari",
        "moduleLabel": "Àpá",
        "lessonLabel": "Ẹkọ",
        "ofLabel": "nínú",
        "minutesShort": "ìṣẹ́jú",
    },
    "ig": {
        "noLessonContent": "Ọ nweghị ọdịnaya nkuzi dị.",
        "untitledLesson": "Nkuzi Enweghị Aha",
        "unsupportedQuestionType": "Ụdị ajụjụ anaghị akwado:",
        "noQuizAvailable": "Ọ nweghị ule dị maka nkuzi a.",
        "answerAllQuestions": "Biko zaa ajụjụ niile tupu izipu.",
        "unableToConnectServer": "Enweghị ike ijikọ na sava.",
        "lessonsCompletedProgress": "nkuzi emechara",
        "moduleLabel": "Modul",
        "lessonLabel": "Nkuzi",
        "ofLabel": "n'ime",
        "minutesShort": "nkeji",
    },
    "ha": {
        "noLessonContent": "Babu wani abun ciki na darasin da ake samu.",
        "untitledLesson": "Darasi Ba Tare da Take ba",
        "unsupportedQuestionType": "Nau'in tambaya da ba a tallafa ba:",
        "noQuizAvailable": "Babu gwaji da ake samu don wannan darasi.",
        "answerAllQuestions": "Da fatan za a amsa duk tambayoyin kafin aikawa.",
        "unableToConnectServer": "Ba a iya haɗawa da uwar garke ba.",
        "lessonsCompletedProgress": "darussa da aka kammala",
        "moduleLabel": "Sashe",
        "lessonLabel": "Darasi",
        "ofLabel": "cikin",
        "minutesShort": "minti",
    },
}

# ------------------------------------------------------------
# 3. Add missing keys to each language block
# ------------------------------------------------------------

language_codes = list(translations.keys())

for i, lang in enumerate(language_codes):
    marker = f"    {lang}: {{"
    start = text.find(marker)

    if start == -1:
        print(f"WARNING: language block not found: {lang}")
        continue

    # Find next language block.
    next_positions = []
    for other in language_codes:
        if other == lang:
            continue
        p = text.find(f"\n    {other}: {{", start + len(marker))
        if p != -1:
            next_positions.append(p)

    end = min(next_positions) if next_positions else len(text)

    block = text[start:end]

    # Insert immediately before the closing brace of this language object.
    close = block.rfind("    }")

    if close == -1:
        print(f"WARNING: closing brace not found: {lang}")
        continue

    additions = []

    for key, value in translations[lang].items():
        if re.search(
            rf"^\s*{re.escape(key)}\s*:",
            block,
            re.MULTILINE
        ):
            continue

        additions.append(
            f"      {key}: {value!r},"
        )

    if additions:
        absolute_close = start + close
        insertion = "\n" + "\n".join(additions) + "\n"
        text = (
            text[:absolute_close]
            + insertion
            + text[absolute_close:]
        )

# ------------------------------------------------------------
# 4. Replace runtime hardcoded strings
# ------------------------------------------------------------

replacements = [
    (
        'No lesson content available.',
        '${miimiidTranslate("noLessonContent", getSavedLanguage())}'
    ),
    (
        '"Untitled Lesson"',
        'miimiidTranslate("untitledLesson", getSavedLanguage())'
    ),
    (
        '"Untitled Lesson";',
        'miimiidTranslate("untitledLesson", getSavedLanguage());'
    ),
    (
        'Unsupported question type:',
        '${miimiidTranslate("unsupportedQuestionType", getSavedLanguage())}'
    ),
    (
        'There is no quiz available for this lesson.',
        '${miimiidTranslate("noQuizAvailable", getSavedLanguage())}'
    ),
    (
        'Please answer all the questions before submitting.',
        '${miimiidTranslate("answerAllQuestions", getSavedLanguage())}'
    ),
    (
        'Unable to connect to the server.',
        '${miimiidTranslate("unableToConnectServer", getSavedLanguage())}'
    ),
]

# Carefully handle the known template/string contexts.
text = text.replace(
    '<p>\n              No lesson content available.\n            </p>',
    '''<p>
              ${miimiidTranslate("noLessonContent", getSavedLanguage())}
            </p>'''
)

text = text.replace(
    '''          "Untitled Lesson";''',
    '''          miimiidTranslate("untitledLesson", getSavedLanguage());'''
)

text = text.replace(
    '''                                      "Untitled Lesson"''',
    '''                                      miimiidTranslate("untitledLesson", getSavedLanguage())'''
)

text = text.replace(
    '''              Unsupported question type:
              ${escapeHtml(questionType)}''',
    '''              ${miimiidTranslate("unsupportedQuestionType", getSavedLanguage())}
              ${escapeHtml(questionType)}'''
)

text = text.replace(
    '''        There is no quiz available for this lesson.
      </span>''',
    '''        ${miimiidTranslate("noQuizAvailable", getSavedLanguage())}
      </span>'''
)

text = text.replace(
    '''        Please answer all the questions before submitting.
      </span>''',
    '''        ${miimiidTranslate("answerAllQuestions", getSavedLanguage())}
      </span>'''
)

text = text.replace(
    '''        Unable to connect to the server.
      </span>''',
    '''        ${miimiidTranslate("unableToConnectServer", getSavedLanguage())}
      </span>'''
)

# Progress text.
text = text.replace(
    '''`${completedLessons} of ${totalLessons} lessons completed`''',
    '''`${completedLessons} ${miimiidTranslate("lessonsCompletedProgress", getSavedLanguage())}`'''
)

# ------------------------------------------------------------
# 5. Replace lesson/module labels in the lesson metadata
# ------------------------------------------------------------

text = text.replace(
    '''`Module ${targetModuleIndex + 1}`''',
    '''`${miimiidTranslate("moduleLabel", getSavedLanguage())} ${targetModuleIndex + 1}`'''
)

text = text.replace(
    '''`Lesson ${lessonNumber} of ${totalLessons}`''',
    '''`${miimiidTranslate("lessonLabel", getSavedLanguage())} ${lessonNumber} ${miimiidTranslate("ofLabel", getSavedLanguage())} ${totalLessons}`'''
)

text = text.replace(
    '''` · ${duration} min`''',
    '''` · ${duration} ${miimiidTranslate("minutesShort", getSavedLanguage())}`'''
)

# ------------------------------------------------------------
# 6. Replace initial static progress placeholder if present
# ------------------------------------------------------------

text = text.replace(
    '0 of 0 lessons completed',
    '0 0'
)

path.write_text(text, encoding="utf-8")

print("Miimiid remaining runtime i18n cleanup completed.")
print("Updated: public/index.html")
