from pathlib import Path
import re

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Add the missing translation keys to every language.
# English is the fallback, but each language gets its own
# explicit translation so the UI does not silently display
# English when the selected language is supported.
# ---------------------------------------------------------

translations = {
    "en": {
        "openCourse": "Open Course",
        "unableToLoadCourses": "Unable to load courses.",
        "invalidCourseId": "Invalid course ID.",
        "questionInstruction": "Answer the questions below before completing the lesson.",
        "unableToConnect": "Unable to connect to the server.",
        "completeLesson": "Complete Lesson",
        "somethingWentWrong": "Something went wrong.",
        "checking": "Checking...",
        "saving": "Saving...",
        "noQuizAvailable": "There is no quiz available for this lesson.",
        "answerAllQuestions": "Please answer all the questions before submitting.",
        "noLessonSelected": "No lesson is currently selected.",
        "submitQuizFirst": "Please complete and submit the quiz before completing this lesson.",
        "lessonNotFound": "Lesson not found.",
        "quizComplete": "Quiz complete!",
        "score": "Score",
        "youGot": "You got",
        "outOf": "out of",
        "correct": "correct.",
        "canCompleteLesson": "You can now complete the lesson.",
        "reviewLessonTryAgain": "Review the lesson and try again.",
    },

    "es": {
        "openCourse": "Abrir curso",
        "unableToLoadCourses": "No se pudieron cargar los cursos.",
        "invalidCourseId": "ID de curso no válido.",
        "questionInstruction": "Responde las preguntas siguientes antes de completar la lección.",
        "unableToConnect": "No se pudo conectar con el servidor.",
        "completeLesson": "Completar lección",
        "somethingWentWrong": "Algo salió mal.",
        "checking": "Comprobando...",
        "saving": "Guardando...",
        "noQuizAvailable": "No hay ningún cuestionario disponible para esta lección.",
        "answerAllQuestions": "Responde todas las preguntas antes de enviar.",
        "noLessonSelected": "No hay ninguna lección seleccionada.",
        "submitQuizFirst": "Completa y envía el cuestionario antes de completar esta lección.",
        "lessonNotFound": "No se encontró la lección.",
        "quizComplete": "¡Cuestionario completado!",
        "score": "Puntuación",
        "youGot": "Obtuviste",
        "outOf": "de",
        "correct": "correctas.",
        "canCompleteLesson": "Ahora puedes completar la lección.",
        "reviewLessonTryAgain": "Repasa la lección e inténtalo de nuevo.",
    },

    "fr": {
        "openCourse": "Ouvrir le cours",
        "unableToLoadCourses": "Impossible de charger les cours.",
        "invalidCourseId": "ID de cours invalide.",
        "questionInstruction": "Répondez aux questions ci-dessous avant de terminer la leçon.",
        "unableToConnect": "Impossible de se connecter au serveur.",
        "completeLesson": "Terminer la leçon",
        "somethingWentWrong": "Une erreur s'est produite.",
        "checking": "Vérification...",
        "saving": "Enregistrement...",
        "noQuizAvailable": "Aucun quiz n'est disponible pour cette leçon.",
        "answerAllQuestions": "Répondez à toutes les questions avant d'envoyer vos réponses.",
        "noLessonSelected": "Aucune leçon n'est actuellement sélectionnée.",
        "submitQuizFirst": "Terminez et envoyez le quiz avant de terminer cette leçon.",
        "lessonNotFound": "Leçon introuvable.",
        "quizComplete": "Quiz terminé !",
        "score": "Score",
        "youGot": "Vous avez obtenu",
        "outOf": "sur",
        "correct": "bonnes réponses.",
        "canCompleteLesson": "Vous pouvez maintenant terminer la leçon.",
        "reviewLessonTryAgain": "Revoyez la leçon et réessayez.",
    },

    "de": {
        "openCourse": "Kurs öffnen",
        "unableToLoadCourses": "Kurse konnten nicht geladen werden.",
        "invalidCourseId": "Ungültige Kurs-ID.",
        "questionInstruction": "Beantworte die folgenden Fragen, bevor du die Lektion abschließt.",
        "unableToConnect": "Verbindung zum Server konnte nicht hergestellt werden.",
        "completeLesson": "Lektion abschließen",
        "somethingWentWrong": "Etwas ist schiefgelaufen.",
        "checking": "Wird überprüft...",
        "saving": "Wird gespeichert...",
        "noQuizAvailable": "Für diese Lektion ist kein Quiz verfügbar.",
        "answerAllQuestions": "Beantworte alle Fragen, bevor du sie absendest.",
        "noLessonSelected": "Keine Lektion ist derzeit ausgewählt.",
        "submitQuizFirst": "Schließe das Quiz ab und sende es ab, bevor du diese Lektion abschließt.",
        "lessonNotFound": "Lektion nicht gefunden.",
        "quizComplete": "Quiz abgeschlossen!",
        "score": "Punktzahl",
        "youGot": "Du hast",
        "outOf": "von",
        "correct": "richtig beantwortet.",
        "canCompleteLesson": "Du kannst die Lektion jetzt abschließen.",
        "reviewLessonTryAgain": "Wiederhole die Lektion und versuche es erneut.",
    },

    "pt": {
        "openCourse": "Abrir curso",
        "unableToLoadCourses": "Não foi possível carregar os cursos.",
        "invalidCourseId": "ID do curso inválido.",
        "questionInstruction": "Responda às perguntas abaixo antes de concluir a lição.",
        "unableToConnect": "Não foi possível conectar ao servidor.",
        "completeLesson": "Concluir lição",
        "somethingWentWrong": "Algo deu errado.",
        "checking": "Verificando...",
        "saving": "Salvando...",
        "noQuizAvailable": "Não há questionário disponível para esta lição.",
        "answerAllQuestions": "Responda a todas as perguntas antes de enviar.",
        "noLessonSelected": "Nenhuma lição está selecionada.",
        "submitQuizFirst": "Conclua e envie o questionário antes de concluir esta lição.",
        "lessonNotFound": "Lição não encontrada.",
        "quizComplete": "Questionário concluído!",
        "score": "Pontuação",
        "youGot": "Você acertou",
        "outOf": "de",
        "correct": "corretas.",
        "canCompleteLesson": "Agora você pode concluir a lição.",
        "reviewLessonTryAgain": "Revise a lição e tente novamente.",
    },

    "it": {
        "openCourse": "Apri corso",
        "unableToLoadCourses": "Impossibile caricare i corsi.",
        "invalidCourseId": "ID corso non valido.",
        "questionInstruction": "Rispondi alle domande qui sotto prima di completare la lezione.",
        "unableToConnect": "Impossibile connettersi al server.",
        "completeLesson": "Completa lezione",
        "somethingWentWrong": "Qualcosa è andato storto.",
        "checking": "Controllo...",
        "saving": "Salvataggio...",
        "noQuizAvailable": "Non ci sono quiz disponibili per questa lezione.",
        "answerAllQuestions": "Rispondi a tutte le domande prima di inviare.",
        "noLessonSelected": "Nessuna lezione è attualmente selezionata.",
        "submitQuizFirst": "Completa e invia il quiz prima di completare questa lezione.",
        "lessonNotFound": "Lezione non trovata.",
        "quizComplete": "Quiz completato!",
        "score": "Punteggio",
        "youGot": "Hai ottenuto",
        "outOf": "su",
        "correct": "risposte corrette.",
        "canCompleteLesson": "Ora puoi completare la lezione.",
        "reviewLessonTryAgain": "Ripassa la lezione e riprova.",
    },

    "nl": {
        "openCourse": "Cursus openen",
        "unableToLoadCourses": "Kan cursussen niet laden.",
        "invalidCourseId": "Ongeldige cursus-ID.",
        "questionInstruction": "Beantwoord de onderstaande vragen voordat je de les voltooit.",
        "unableToConnect": "Kan geen verbinding maken met de server.",
        "completeLesson": "Les voltooien",
        "somethingWentWrong": "Er is iets misgegaan.",
        "checking": "Controleren...",
        "saving": "Opslaan...",
        "noQuizAvailable": "Er is geen quiz beschikbaar voor deze les.",
        "answerAllQuestions": "Beantwoord alle vragen voordat je ze indient.",
        "noLessonSelected": "Er is momenteel geen les geselecteerd.",
        "submitQuizFirst": "Voltooi en dien de quiz in voordat je deze les voltooit.",
        "lessonNotFound": "Les niet gevonden.",
        "quizComplete": "Quiz voltooid!",
        "score": "Score",
        "youGot": "Je hebt",
        "outOf": "van de",
        "correct": "goed.",
        "canCompleteLesson": "Je kunt de les nu voltooien.",
        "reviewLessonTryAgain": "Bekijk de les opnieuw en probeer het nog eens.",
    },

    "pl": {
        "openCourse": "Otwórz kurs",
        "unableToLoadCourses": "Nie udało się załadować kursów.",
        "invalidCourseId": "Nieprawidłowy identyfikator kursu.",
        "questionInstruction": "Odpowiedz na poniższe pytania przed ukończeniem lekcji.",
        "unableToConnect": "Nie można połączyć się z serwerem.",
        "completeLesson": "Ukończ lekcję",
        "somethingWentWrong": "Coś poszło nie tak.",
        "checking": "Sprawdzanie...",
        "saving": "Zapisywanie...",
        "noQuizAvailable": "Dla tej lekcji nie ma dostępnego quizu.",
        "answerAllQuestions": "Odpowiedz na wszystkie pytania przed wysłaniem.",
        "noLessonSelected": "Nie wybrano aktualnie żadnej lekcji.",
        "submitQuizFirst": "Ukończ i wyślij quiz przed ukończeniem tej lekcji.",
        "lessonNotFound": "Nie znaleziono lekcji.",
        "quizComplete": "Quiz ukończony!",
        "score": "Wynik",
        "youGot": "Uzyskano",
        "outOf": "z",
        "correct": "poprawnych odpowiedzi.",
        "canCompleteLesson": "Możesz teraz ukończyć lekcję.",
        "reviewLessonTryAgain": "Powtórz lekcję i spróbuj ponownie.",
    },

    "tr": {
        "openCourse": "Kursu Aç",
        "unableToLoadCourses": "Kurslar yüklenemedi.",
        "invalidCourseId": "Geçersiz kurs kimliği.",
        "questionInstruction": "Dersi tamamlamadan önce aşağıdaki soruları cevaplayın.",
        "unableToConnect": "Sunucuya bağlanılamadı.",
        "completeLesson": "Dersi Tamamla",
        "somethingWentWrong": "Bir şeyler yanlış gitti.",
        "checking": "Kontrol ediliyor...",
        "saving": "Kaydediliyor...",
        "noQuizAvailable": "Bu ders için kullanılabilir bir test yok.",
        "answerAllQuestions": "Göndermeden önce tüm soruları cevaplayın.",
        "noLessonSelected": "Şu anda seçili bir ders yok.",
        "submitQuizFirst": "Bu dersi tamamlamadan önce testi tamamlayıp gönderin.",
        "lessonNotFound": "Ders bulunamadı.",
        "quizComplete": "Test tamamlandı!",
        "score": "Puan",
        "youGot": "Doğru cevap",
        "outOf": "/",
        "correct": "doğru.",
        "canCompleteLesson": "Artık dersi tamamlayabilirsiniz.",
        "reviewLessonTryAgain": "Dersi gözden geçirip tekrar deneyin.",
    },

    "ru": {
        "openCourse": "Открыть курс",
        "unableToLoadCourses": "Не удалось загрузить курсы.",
        "invalidCourseId": "Недопустимый идентификатор курса.",
        "questionInstruction": "Ответьте на вопросы ниже перед завершением урока.",
        "unableToConnect": "Не удалось подключиться к серверу.",
        "completeLesson": "Завершить урок",
        "somethingWentWrong": "Что-то пошло не так.",
        "checking": "Проверка...",
        "saving": "Сохранение...",
        "noQuizAvailable": "Для этого урока нет доступного теста.",
        "answerAllQuestions": "Ответьте на все вопросы перед отправкой.",
        "noLessonSelected": "Урок не выбран.",
        "submitQuizFirst": "Пройдите и отправьте тест перед завершением этого урока.",
        "lessonNotFound": "Урок не найден.",
        "quizComplete": "Тест завершён!",
        "score": "Результат",
        "youGot": "Правильных ответов",
        "outOf": "из",
        "correct": "правильных.",
        "canCompleteLesson": "Теперь можно завершить урок.",
        "reviewLessonTryAgain": "Повторите урок и попробуйте снова.",
    },

    "uk": {
        "openCourse": "Відкрити курс",
        "unableToLoadCourses": "Не вдалося завантажити курси.",
        "invalidCourseId": "Недійсний ідентифікатор курсу.",
        "questionInstruction": "Дайте відповіді на наведені нижче запитання перед завершенням уроку.",
        "unableToConnect": "Не вдалося підключитися до сервера.",
        "completeLesson": "Завершити урок",
        "somethingWentWrong": "Щось пішло не так.",
        "checking": "Перевірка...",
        "saving": "Збереження...",
        "noQuizAvailable": "Для цього уроку немає доступного тесту.",
        "answerAllQuestions": "Дайте відповіді на всі запитання перед надсиланням.",
        "noLessonSelected": "Урок не вибрано.",
        "submitQuizFirst": "Пройдіть і надішліть тест перед завершенням цього уроку.",
        "lessonNotFound": "Урок не знайдено.",
        "quizComplete": "Тест завершено!",
        "score": "Результат",
        "youGot": "Правильних відповідей",
        "outOf": "із",
        "correct": "правильних.",
        "canCompleteLesson": "Тепер ви можете завершити урок.",
        "reviewLessonTryAgain": "Перегляньте урок і спробуйте ще раз.",
    },

    "ar": {
        "openCourse": "فتح الدورة",
        "unableToLoadCourses": "تعذر تحميل الدورات.",
        "invalidCourseId": "معرّف الدورة غير صالح.",
        "questionInstruction": "أجب عن الأسئلة أدناه قبل إكمال الدرس.",
        "unableToConnect": "تعذر الاتصال بالخادم.",
        "completeLesson": "إكمال الدرس",
        "somethingWentWrong": "حدث خطأ ما.",
        "checking": "جارٍ التحقق...",
        "saving": "جارٍ الحفظ...",
        "noQuizAvailable": "لا يوجد اختبار متاح لهذا الدرس.",
        "answerAllQuestions": "أجب عن جميع الأسئلة قبل الإرسال.",
        "noLessonSelected": "لم يتم تحديد درس حاليًا.",
        "submitQuizFirst": "أكمل الاختبار وأرسله قبل إكمال هذا الدرس.",
        "lessonNotFound": "لم يتم العثور على الدرس.",
        "quizComplete": "اكتمل الاختبار!",
        "score": "النتيجة",
        "youGot": "أجبت بشكل صحيح عن",
        "outOf": "من",
        "correct": "إجابات صحيحة.",
        "canCompleteLesson": "يمكنك الآن إكمال الدرس.",
        "reviewLessonTryAgain": "راجع الدرس وحاول مرة أخرى.",
    },

    "he": {
        "openCourse": "פתיחת קורס",
        "unableToLoadCourses": "לא ניתן לטעון את הקורסים.",
        "invalidCourseId": "מזהה קורס לא חוקי.",
        "questionInstruction": "ענה על השאלות שלהלן לפני השלמת השיעור.",
        "unableToConnect": "לא ניתן להתחבר לשרת.",
        "completeLesson": "השלמת שיעור",
        "somethingWentWrong": "משהו השתבש.",
        "checking": "בודק...",
        "saving": "שומר...",
        "noQuizAvailable": "אין שאלון זמין לשיעור זה.",
        "answerAllQuestions": "ענה על כל השאלות לפני השליחה.",
        "noLessonSelected": "לא נבחר שיעור כרגע.",
        "submitQuizFirst": "השלם ושלח את השאלון לפני השלמת השיעור.",
        "lessonNotFound": "השיעור לא נמצא.",
        "quizComplete": "השאלון הושלם!",
        "score": "ציון",
        "youGot": "ענית נכון על",
        "outOf": "מתוך",
        "correct": "תשובות נכונות.",
        "canCompleteLesson": "כעת ניתן להשלים את השיעור.",
        "reviewLessonTryAgain": "חזור על השיעור ונסה שוב.",
    },

    "fa": {
        "openCourse": "باز کردن دوره",
        "unableToLoadCourses": "بارگذاری دوره‌ها ممکن نیست.",
        "invalidCourseId": "شناسه دوره نامعتبر است.",
        "questionInstruction": "پیش از تکمیل درس، به پرسش‌های زیر پاسخ دهید.",
        "unableToConnect": "اتصال به سرور ممکن نیست.",
        "completeLesson": "تکمیل درس",
        "somethingWentWrong": "مشکلی پیش آمد.",
        "checking": "در حال بررسی...",
        "saving": "در حال ذخیره...",
        "noQuizAvailable": "برای این درس آزمونی در دسترس نیست.",
        "answerAllQuestions": "پیش از ارسال، به همه پرسش‌ها پاسخ دهید.",
        "noLessonSelected": "در حال حاضر درسی انتخاب نشده است.",
        "submitQuizFirst": "پیش از تکمیل این درس، آزمون را کامل و ارسال کنید.",
        "lessonNotFound": "درس پیدا نشد.",
        "quizComplete": "آزمون تکمیل شد!",
        "score": "امتیاز",
        "youGot": "پاسخ صحیح شما",
        "outOf": "از",
        "correct": "پاسخ صحیح بود.",
        "canCompleteLesson": "اکنون می‌توانید درس را تکمیل کنید.",
        "reviewLessonTryAgain": "درس را مرور کنید و دوباره تلاش کنید.",
    },

    "hi": {
        "openCourse": "कोर्स खोलें",
        "unableToLoadCourses": "कोर्स लोड नहीं किए जा सके।",
        "invalidCourseId": "अमान्य कोर्स आईडी।",
        "questionInstruction": "पाठ पूरा करने से पहले नीचे दिए गए प्रश्नों के उत्तर दें।",
        "unableToConnect": "सर्वर से कनेक्ट नहीं हो सका।",
        "completeLesson": "पाठ पूरा करें",
        "somethingWentWrong": "कुछ गलत हो गया।",
        "checking": "जाँच हो रही है...",
        "saving": "सहेजा जा रहा है...",
        "noQuizAvailable": "इस पाठ के लिए कोई क्विज़ उपलब्ध नहीं है।",
        "answerAllQuestions": "जमा करने से पहले सभी प्रश्नों के उत्तर दें।",
        "noLessonSelected": "अभी कोई पाठ चयनित नहीं है।",
        "submitQuizFirst": "इस पाठ को पूरा करने से पहले क्विज़ पूरा करके जमा करें।",
        "lessonNotFound": "पाठ नहीं मिला।",
        "quizComplete": "क्विज़ पूरा हुआ!",
        "score": "स्कोर",
        "youGot": "आपने सही उत्तर दिए",
        "outOf": "में से",
        "correct": "सही।",
        "canCompleteLesson": "अब आप पाठ पूरा कर सकते हैं।",
        "reviewLessonTryAgain": "पाठ की समीक्षा करें और फिर प्रयास करें।",
    },

    "bn": {
        "openCourse": "কোর্স খুলুন",
        "unableToLoadCourses": "কোর্সগুলো লোড করা যায়নি।",
        "invalidCourseId": "অবৈধ কোর্স আইডি।",
        "questionInstruction": "পাঠ সম্পন্ন করার আগে নিচের প্রশ্নগুলোর উত্তর দিন।",
        "unableToConnect": "সার্ভারের সাথে সংযোগ করা যায়নি।",
        "completeLesson": "পাঠ সম্পন্ন করুন",
        "somethingWentWrong": "কিছু ভুল হয়েছে।",
        "checking": "যাচাই করা হচ্ছে...",
        "saving": "সংরক্ষণ করা হচ্ছে...",
        "noQuizAvailable": "এই পাঠের জন্য কোনো কুইজ উপলভ্য নেই।",
        "answerAllQuestions": "জমা দেওয়ার আগে সব প্রশ্নের উত্তর দিন।",
        "noLessonSelected": "এখন কোনো পাঠ নির্বাচন করা হয়নি।",
        "submitQuizFirst": "এই পাঠ সম্পন্ন করার আগে কুইজটি সম্পন্ন করে জমা দিন।",
        "lessonNotFound": "পাঠ পাওয়া যায়নি।",
        "quizComplete": "কুইজ সম্পন্ন হয়েছে!",
        "score": "স্কোর",
        "youGot": "আপনি সঠিক উত্তর দিয়েছেন",
        "outOf": "এর মধ্যে",
        "correct": "টি।",
        "canCompleteLesson": "এখন আপনি পাঠটি সম্পন্ন করতে পারেন।",
        "reviewLessonTryAgain": "পাঠটি পর্যালোচনা করে আবার চেষ্টা করুন।",
    },

    "ur": {
        "openCourse": "کورس کھولیں",
        "unableToLoadCourses": "کورسز لوڈ نہیں کیے جا سکے۔",
        "invalidCourseId": "غلط کورس آئی ڈی۔",
        "questionInstruction": "سبق مکمل کرنے سے پہلے نیچے دیے گئے سوالات کے جواب دیں۔",
        "unableToConnect": "سرور سے رابطہ نہیں ہو سکا۔",
        "completeLesson": "سبق مکمل کریں",
        "somethingWentWrong": "کچھ غلط ہو گیا۔",
        "checking": "جانچ ہو رہی ہے...",
        "saving": "محفوظ کیا جا رہا ہے...",
        "noQuizAvailable": "اس سبق کے لیے کوئی کوئز دستیاب نہیں۔",
        "answerAllQuestions": "جمع کرنے سے پہلے تمام سوالات کے جواب دیں۔",
        "noLessonSelected": "فی الحال کوئی سبق منتخب نہیں ہے۔",
        "submitQuizFirst": "اس سبق کو مکمل کرنے سے پہلے کوئز مکمل کرکے جمع کریں۔",
        "lessonNotFound": "سبق نہیں ملا۔",
        "quizComplete": "کوئز مکمل ہو گیا!",
        "score": "اسکور",
        "youGot": "آپ نے درست جواب دیے",
        "outOf": "میں سے",
        "correct": "درست۔",
        "canCompleteLesson": "اب آپ سبق مکمل کر سکتے ہیں۔",
        "reviewLessonTryAgain": "سبق کا جائزہ لیں اور دوبارہ کوشش کریں۔",
    },

    "id": {
        "openCourse": "Buka Kursus",
        "unableToLoadCourses": "Kursus tidak dapat dimuat.",
        "invalidCourseId": "ID kursus tidak valid.",
        "questionInstruction": "Jawab pertanyaan di bawah sebelum menyelesaikan pelajaran.",
        "unableToConnect": "Tidak dapat terhubung ke server.",
        "completeLesson": "Selesaikan Pelajaran",
        "somethingWentWrong": "Terjadi kesalahan.",
        "checking": "Memeriksa...",
        "saving": "Menyimpan...",
        "noQuizAvailable": "Tidak ada kuis yang tersedia untuk pelajaran ini.",
        "answerAllQuestions": "Jawab semua pertanyaan sebelum mengirim.",
        "noLessonSelected": "Belum ada pelajaran yang dipilih.",
        "submitQuizFirst": "Selesaikan dan kirim kuis sebelum menyelesaikan pelajaran ini.",
        "lessonNotFound": "Pelajaran tidak ditemukan.",
        "quizComplete": "Kuis selesai!",
        "score": "Skor",
        "youGot": "Anda menjawab benar",
        "outOf": "dari",
        "correct": "jawaban.",
        "canCompleteLesson": "Sekarang Anda dapat menyelesaikan pelajaran.",
        "reviewLessonTryAgain": "Tinjau pelajaran dan coba lagi.",
    },

    "ms": {
        "openCourse": "Buka Kursus",
        "unableToLoadCourses": "Kursus tidak dapat dimuat.",
        "invalidCourseId": "ID kursus tidak sah.",
        "questionInstruction": "Jawab soalan di bawah sebelum melengkapkan pelajaran.",
        "unableToConnect": "Tidak dapat menyambung ke pelayan.",
        "completeLesson": "Lengkapkan Pelajaran",
        "somethingWentWrong": "Sesuatu telah berlaku.",
        "checking": "Menyemak...",
        "saving": "Menyimpan...",
        "noQuizAvailable": "Tiada kuiz tersedia untuk pelajaran ini.",
        "answerAllQuestions": "Jawab semua soalan sebelum menghantar.",
        "noLessonSelected": "Tiada pelajaran dipilih pada masa ini.",
        "submitQuizFirst": "Lengkapkan dan hantar kuiz sebelum melengkapkan pelajaran ini.",
        "lessonNotFound": "Pelajaran tidak ditemui.",
        "quizComplete": "Kuiz selesai!",
        "score": "Skor",
        "youGot": "Anda mendapat",
        "outOf": "daripada",
        "correct": "jawapan betul.",
        "canCompleteLesson": "Anda kini boleh melengkapkan pelajaran.",
        "reviewLessonTryAgain": "Semak semula pelajaran dan cuba lagi.",
    },

    "vi": {
        "openCourse": "Mở khóa học",
        "unableToLoadCourses": "Không thể tải các khóa học.",
        "invalidCourseId": "ID khóa học không hợp lệ.",
        "questionInstruction": "Hãy trả lời các câu hỏi dưới đây trước khi hoàn thành bài học.",
        "unableToConnect": "Không thể kết nối với máy chủ.",
        "completeLesson": "Hoàn thành bài học",
        "somethingWentWrong": "Đã xảy ra lỗi.",
        "checking": "Đang kiểm tra...",
        "saving": "Đang lưu...",
        "noQuizAvailable": "Không có bài kiểm tra cho bài học này.",
        "answerAllQuestions": "Hãy trả lời tất cả câu hỏi trước khi gửi.",
        "noLessonSelected": "Hiện chưa chọn bài học nào.",
        "submitQuizFirst": "Hãy hoàn thành và gửi bài kiểm tra trước khi hoàn thành bài học này.",
        "lessonNotFound": "Không tìm thấy bài học.",
        "quizComplete": "Đã hoàn thành bài kiểm tra!",
        "score": "Điểm",
        "youGot": "Bạn trả lời đúng",
        "outOf": "trên",
        "correct": "câu.",
        "canCompleteLesson": "Bây giờ bạn có thể hoàn thành bài học.",
        "reviewLessonTryAgain": "Hãy xem lại bài học và thử lại.",
    },

    "th": {
        "openCourse": "เปิดหลักสูตร",
        "unableToLoadCourses": "ไม่สามารถโหลดหลักสูตรได้",
        "invalidCourseId": "รหัสหลักสูตรไม่ถูกต้อง",
        "questionInstruction": "ตอบคำถามด้านล่างก่อนจบบทเรียน",
        "unableToConnect": "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        "completeLesson": "จบบทเรียน",
        "somethingWentWrong": "เกิดข้อผิดพลาด",
        "checking": "กำลังตรวจสอบ...",
        "saving": "กำลังบันทึก...",
        "noQuizAvailable": "ไม่มีแบบทดสอบสำหรับบทเรียนนี้",
        "answerAllQuestions": "ตอบคำถามทั้งหมดก่อนส่ง",
        "noLessonSelected": "ยังไม่ได้เลือกบทเรียน",
        "submitQuizFirst": "ทำแบบทดสอบและส่งคำตอบก่อนจบบทเรียนนี้",
        "lessonNotFound": "ไม่พบบทเรียน",
        "quizComplete": "ทำแบบทดสอบเสร็จแล้ว!",
        "score": "คะแนน",
        "youGot": "ตอบถูก",
        "outOf": "จาก",
        "correct": "ข้อ",
        "canCompleteLesson": "ตอนนี้คุณสามารถจบบทเรียนได้",
        "reviewLessonTryAgain": "ทบทวนบทเรียนแล้วลองอีกครั้ง",
    },

    "zh": {
        "openCourse": "打开课程",
        "unableToLoadCourses": "无法加载课程。",
        "invalidCourseId": "课程 ID 无效。",
        "questionInstruction": "完成课程前，请回答下面的问题。",
        "unableToConnect": "无法连接到服务器。",
        "completeLesson": "完成课程",
        "somethingWentWrong": "出了点问题。",
        "checking": "正在检查...",
        "saving": "正在保存...",
        "noQuizAvailable": "本课程暂无测验。",
        "answerAllQuestions": "提交前请回答所有问题。",
        "noLessonSelected": "当前未选择课程。",
        "submitQuizFirst": "请先完成并提交测验，再完成本课程。",
        "lessonNotFound": "未找到课程。",
        "quizComplete": "测验完成！",
        "score": "得分",
        "youGot": "你答对了",
        "outOf": "共",
        "correct": "题。",
        "canCompleteLesson": "现在可以完成课程了。",
        "reviewLessonTryAgain": "复习课程后再试一次。",
    },

    "ja": {
        "openCourse": "コースを開く",
        "unableToLoadCourses": "コースを読み込めませんでした。",
        "invalidCourseId": "無効なコースIDです。",
        "questionInstruction": "レッスンを完了する前に、以下の質問に答えてください。",
        "unableToConnect": "サーバーに接続できません。",
        "completeLesson": "レッスンを完了",
        "somethingWentWrong": "問題が発生しました。",
        "checking": "確認中...",
        "saving": "保存中...",
        "noQuizAvailable": "このレッスンにはクイズがありません。",
        "answerAllQuestions": "送信する前にすべての質問に答えてください。",
        "noLessonSelected": "現在レッスンが選択されていません。",
        "submitQuizFirst": "このレッスンを完了する前に、クイズを完了して送信してください。",
        "lessonNotFound": "レッスンが見つかりません。",
        "quizComplete": "クイズ完了！",
        "score": "スコア",
        "youGot": "正解数",
        "outOf": "全",
        "correct": "問中。",
        "canCompleteLesson": "これでレッスンを完了できます。",
        "reviewLessonTryAgain": "レッスンを復習してもう一度試してください。",
    },

    "ko": {
        "openCourse": "코스 열기",
        "unableToLoadCourses": "코스를 불러올 수 없습니다.",
        "invalidCourseId": "잘못된 코스 ID입니다.",
        "questionInstruction": "수업을 완료하기 전에 아래 질문에 답하세요.",
        "unableToConnect": "서버에 연결할 수 없습니다.",
        "completeLesson": "수업 완료",
        "somethingWentWrong": "문제가 발생했습니다.",
        "checking": "확인 중...",
        "saving": "저장 중...",
        "noQuizAvailable": "이 수업에는 사용할 수 있는 퀴즈가 없습니다.",
        "answerAllQuestions": "제출하기 전에 모든 질문에 답하세요.",
        "noLessonSelected": "현재 선택된 수업이 없습니다.",
        "submitQuizFirst": "이 수업을 완료하기 전에 퀴즈를 완료하고 제출하세요.",
        "lessonNotFound": "수업을 찾을 수 없습니다.",
        "quizComplete": "퀴즈 완료!",
        "score": "점수",
        "youGot": "정답",
        "outOf": "총",
        "correct": "개.",
        "canCompleteLesson": "이제 수업을 완료할 수 있습니다.",
        "reviewLessonTryAgain": "수업을 다시 살펴보고 시도해 보세요.",
    },

    "sw": {
        "openCourse": "Fungua Kozi",
        "unableToLoadCourses": "Imeshindwa kupakia kozi.",
        "invalidCourseId": "Kitambulisho cha kozi si sahihi.",
        "questionInstruction": "Jibu maswali yaliyo hapa chini kabla ya kukamilisha somo.",
        "unableToConnect": "Imeshindwa kuunganisha na seva.",
        "completeLesson": "Kamilisha Somo",
        "somethingWentWrong": "Kuna tatizo limetokea.",
        "checking": "Inakagua...",
        "saving": "Inahifadhi...",
        "noQuizAvailable": "Hakuna jaribio linalopatikana kwa somo hili.",
        "answerAllQuestions": "Jibu maswali yote kabla ya kutuma.",
        "noLessonSelected": "Hakuna somo lililochaguliwa kwa sasa.",
        "submitQuizFirst": "Kamilisha na utume jaribio kabla ya kukamilisha somo hili.",
        "lessonNotFound": "Somo halikupatikana.",
        "quizComplete": "Jaribio limekamilika!",
        "score": "Alama",
        "youGot": "Umejibu kwa usahihi",
        "outOf": "kati ya",
        "correct": "majibu.",
        "canCompleteLesson": "Sasa unaweza kukamilisha somo.",
        "reviewLessonTryAgain": "Pitia somo na ujaribu tena.",
    },

    "yo": {
        "openCourse": "Ṣí Ẹkọ",
        "unableToLoadCourses": "A kò lè gbe àwọn ẹkọ wọlé.",
        "invalidCourseId": "ID ẹkọ kò tọ́.",
        "questionInstruction": "Dáhùn àwọn ìbéèrè tó wà ní isalẹ kí o tó parí ẹkọ.",
        "unableToConnect": "A kò lè sopọ̀ mọ́ olupin.",
        "completeLesson": "Parí Ẹkọ",
        "somethingWentWrong": "Ohun kan ṣẹlẹ̀ tí kò tọ́.",
        "checking": "Ń ṣàyẹ̀wò...",
        "saving": "Ń fipamọ́...",
        "noQuizAvailable": "Ko si idanwo fun ẹkọ yii.",
        "answerAllQuestions": "Dáhùn gbogbo àwọn ìbéèrè kí o tó fi ránṣẹ́.",
        "noLessonSelected": "A kò yan ẹkọ kankan báyìí.",
        "submitQuizFirst": "Parí kí o sì fi idanwo ránṣẹ́ kí o tó parí ẹkọ yii.",
        "lessonNotFound": "A kò rí ẹkọ náà.",
        "quizComplete": "Idanwo ti parí!",
        "score": "Àmì",
        "youGot": "O dáhùn tọ́",
        "outOf": "nínú",
        "correct": "dáhùn.",
        "canCompleteLesson": "O lè parí ẹkọ báyìí.",
        "reviewLessonTryAgain": "Ṣàtúnyẹ̀wò ẹkọ náà kí o sì tún gbìyànjú.",
    },

    "ig": {
        "openCourse": "Mepee Nkuzi",
        "unableToLoadCourses": "Enweghị ike ibunye nkuzi.",
        "invalidCourseId": "ID nkuzi ezighi ezi.",
        "questionInstruction": "Zaa ajụjụ ndị dị n'okpuru tupu ịmechaa nkuzi.",
        "unableToConnect": "Enweghị ike ijikọ na sava.",
        "completeLesson": "Mechaa Nkuzi",
        "somethingWentWrong": "Ihe adịghị mma mere.",
        "checking": "A na-enyocha...",
        "saving": "A na-echekwa...",
        "noQuizAvailable": "Enweghị ule dị maka nkuzi a.",
        "answerAllQuestions": "Zaa ajụjụ niile tupu izipu.",
        "noLessonSelected": "Enweghị nkuzi ahọpụtara ugbu a.",
        "submitQuizFirst": "Mechaa ma zipụ ule tupu ịmechaa nkuzi a.",
        "lessonNotFound": "Achọtaghị nkuzi.",
        "quizComplete": "Ule agwụla!",
        "score": "Akara",
        "youGot": "Ị zara nke ọma",
        "outOf": "n'ime",
        "correct": "azịza.",
        "canCompleteLesson": "Ị nwere ike imecha nkuzi ugbu a.",
        "reviewLessonTryAgain": "Nyochaa nkuzi ahụ ma nwaa ọzọ.",
    },

    "ha": {
        "openCourse": "Buɗe Kwas",
        "unableToLoadCourses": "Ba a iya loda kwas-kwasan ba.",
        "invalidCourseId": "ID ɗin kwas ba daidai ba ne.",
        "questionInstruction": "Amsa tambayoyin da ke ƙasa kafin ka kammala darasin.",
        "unableToConnect": "Ba a iya haɗawa da uwar garke ba.",
        "completeLesson": "Kammala Darasi",
        "somethingWentWrong": "Wani abu ya faru ba daidai ba.",
        "checking": "Ana dubawa...",
        "saving": "Ana adanawa...",
        "noQuizAvailable": "Babu gwaji da ake da shi don wannan darasi.",
        "answerAllQuestions": "Amsa duk tambayoyin kafin aikawa.",
        "noLessonSelected": "Ba a zaɓi wani darasi a yanzu ba.",
        "submitQuizFirst": "Kammala kuma aika gwajin kafin ka kammala wannan darasi.",
        "lessonNotFound": "Ba a sami darasin ba.",
        "quizComplete": "An kammala gwajin!",
        "score": "Maki",
        "youGot": "Ka amsa daidai",
        "outOf": "cikin",
        "correct": "amsoshi.",
        "canCompleteLesson": "Yanzu za ka iya kammala darasin.",
        "reviewLessonTryAgain": "Sake duba darasin sannan ka sake gwadawa.",
    },
}

# ---------------------------------------------------------
# 2. Locate the translation object.
# We use the existing object instead of creating another
# translation system.
# ---------------------------------------------------------

start = text.find("const MIIMIID_TRANSLATIONS = {")
end = text.find("\n  function miimiidTranslate", start)

if start == -1 or end == -1:
    raise SystemExit("Could not locate MIIMIID_TRANSLATIONS.")

translation_block = text[start:end]

# ---------------------------------------------------------
# 3. Insert missing keys into each existing language object.
# ---------------------------------------------------------

for lang, values in translations.items():
    pattern = rf"(\n    {re.escape(lang)}:\s*\{{)"
    match = re.search(pattern, translation_block)

    if not match:
        raise SystemExit(f"Language block not found: {lang}")

    insert_at = match.end()

    additions = "\n" + "".join(
        f'      {key}: {value!r},\n'
        for key, value in values.items()
        if key not in re.search(
            rf"{re.escape(lang)}:\s*\{{(.*?)\n    \}}",
            translation_block,
            re.S
        ).group(1)
    )

    translation_block = (
        translation_block[:insert_at]
        + additions
        + translation_block[insert_at:]
    )

text = text[:start] + translation_block + text[end:]

# ---------------------------------------------------------
# 4. Replace remaining hardcoded UI strings.
# ---------------------------------------------------------

replacements = {
    '"Checking..."': 'miimiidTranslate("checking", getSavedLanguage())',
    '"Saving..."': 'miimiidTranslate("saving", getSavedLanguage())',
    '"Unable to connect to the server."': 'miimiidTranslate("unableToConnect", getSavedLanguage())',
}

for old, new in replacements.items():
    text = text.replace(old, new)

text = text.replace(
    '"There is no quiz available for this lesson."',
    'miimiidTranslate("noQuizAvailable", getSavedLanguage())'
)

text = text.replace(
    '"Please answer all the questions before submitting."',
    'miimiidTranslate("answerAllQuestions", getSavedLanguage())'
)

text = text.replace(
    '"No lesson is currently selected."',
    'miimiidTranslate("noLessonSelected", getSavedLanguage())'
)

text = text.replace(
    '"Please complete and submit the quiz before completing this lesson."',
    'miimiidTranslate("submitQuizFirst", getSavedLanguage())'
)

text = text.replace(
    '"Lesson not found."',
    'miimiidTranslate("lessonNotFound", getSavedLanguage())'
)

# ---------------------------------------------------------
# 5. Remove the visible "Untitled Course" fallback.
# Course data must remain dynamic.
# ---------------------------------------------------------

text = text.replace(
    'course.title ||\n                  "Untitled Course"',
    'course.title ||\n                  ""'
)

text = text.replace(
    'courseDataCache.title ||\n          "Untitled Course"',
    'courseDataCache.title ||\n          ""'
)

# ---------------------------------------------------------
# 6. Remove the visible hardcoded "No courses available yet"
# placeholder card. Empty state is generated dynamically
# from the translation system instead.
# ---------------------------------------------------------

text = text.replace(
'''      container.innerHTML = `
        <div class="card">
          <p>
            No courses available yet.
          </p>
        </div>
      `;''',
'''      container.innerHTML = `
        <div class="card">
          <p>${miimiidTranslate("noModules", getSavedLanguage())}</p>
        </div>
      `;'''
)

# ---------------------------------------------------------
# 7. Write the result.
# ---------------------------------------------------------

path.write_text(text, encoding="utf-8")

print("Miimiid i18n update completed.")
print("Updated:", path)
