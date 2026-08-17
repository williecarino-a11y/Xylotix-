from pathlib import Path
import re

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

# ---------------------------------------------------------
# 1. Add missing AUTH translation keys to every language.
# ---------------------------------------------------------

translations = {
    "en": {
        "authWelcome": "Welcome to Miimiid",
        "authSignInSubtitle": "Sign in to continue learning",
        "authCreateAccount": "Create your Miimiid account",
        "authCreateSubtitle": "Create an account to start learning",
        "authResetSubtitle": "Enter your email to receive password reset instructions",
        "authPasswordMismatch": "Passwords do not match.",
        "authCreatingAccount": "Creating your account...",
        "authAccountCreated": "Account created successfully.",
        "authCreateAccountError": "Unable to create your account.",
        "authEnterEmail": "Enter your email address.",
        "authSendingResetInstructions": "Sending reset instructions...",
        "authResetInstructionsSent": "Password reset instructions have been sent.",
        "authRequestResetError": "Unable to request password reset.",
        "authInvalidResetLink": "This password reset link is invalid or missing.",
        "authPasswordMinLength": "Password must be at least 8 characters.",
        "authResettingPassword": "Resetting your password...",
        "authResetPasswordError": "Unable to reset your password.",
        "authPasswordResetSuccess": "Your password has been reset successfully."
    },

    "es": {
        "authWelcome": "Bienvenido a Miimiid",
        "authSignInSubtitle": "Inicia sesión para continuar aprendiendo",
        "authCreateAccount": "Crea tu cuenta de Miimiid",
        "authCreateSubtitle": "Crea una cuenta para comenzar a aprender",
        "authResetSubtitle": "Introduce tu correo electrónico para recibir instrucciones para restablecer tu contraseña",
        "authPasswordMismatch": "Las contraseñas no coinciden.",
        "authCreatingAccount": "Creando tu cuenta...",
        "authAccountCreated": "Cuenta creada correctamente.",
        "authCreateAccountError": "No se pudo crear tu cuenta.",
        "authEnterEmail": "Introduce tu dirección de correo electrónico.",
        "authSendingResetInstructions": "Enviando instrucciones de restablecimiento...",
        "authResetInstructionsSent": "Se han enviado las instrucciones para restablecer la contraseña.",
        "authRequestResetError": "No se pudieron solicitar las instrucciones de restablecimiento.",
        "authInvalidResetLink": "Este enlace para restablecer la contraseña no es válido o falta.",
        "authPasswordMinLength": "La contraseña debe tener al menos 8 caracteres.",
        "authResettingPassword": "Restableciendo tu contraseña...",
        "authResetPasswordError": "No se pudo restablecer tu contraseña.",
        "authPasswordResetSuccess": "Tu contraseña se ha restablecido correctamente."
    },

    "fr": {
        "authWelcome": "Bienvenue sur Miimiid",
        "authSignInSubtitle": "Connectez-vous pour continuer votre apprentissage",
        "authCreateAccount": "Créez votre compte Miimiid",
        "authCreateSubtitle": "Créez un compte pour commencer à apprendre",
        "authResetSubtitle": "Saisissez votre adresse e-mail pour recevoir les instructions de réinitialisation",
        "authPasswordMismatch": "Les mots de passe ne correspondent pas.",
        "authCreatingAccount": "Création de votre compte...",
        "authAccountCreated": "Compte créé avec succès.",
        "authCreateAccountError": "Impossible de créer votre compte.",
        "authEnterEmail": "Saisissez votre adresse e-mail.",
        "authSendingResetInstructions": "Envoi des instructions de réinitialisation...",
        "authResetInstructionsSent": "Les instructions de réinitialisation du mot de passe ont été envoyées.",
        "authRequestResetError": "Impossible de demander la réinitialisation du mot de passe.",
        "authInvalidResetLink": "Ce lien de réinitialisation du mot de passe est invalide ou manquant.",
        "authPasswordMinLength": "Le mot de passe doit comporter au moins 8 caractères.",
        "authResettingPassword": "Réinitialisation de votre mot de passe...",
        "authResetPasswordError": "Impossible de réinitialiser votre mot de passe.",
        "authPasswordResetSuccess": "Votre mot de passe a été réinitialisé avec succès."
    },

    "de": {
        "authWelcome": "Willkommen bei Miimiid",
        "authSignInSubtitle": "Melden Sie sich an, um weiterzulernen",
        "authCreateAccount": "Erstellen Sie Ihr Miimiid-Konto",
        "authCreateSubtitle": "Erstellen Sie ein Konto, um mit dem Lernen zu beginnen",
        "authResetSubtitle": "Geben Sie Ihre E-Mail-Adresse ein, um Anweisungen zum Zurücksetzen des Passworts zu erhalten",
        "authPasswordMismatch": "Die Passwörter stimmen nicht überein.",
        "authCreatingAccount": "Ihr Konto wird erstellt...",
        "authAccountCreated": "Konto erfolgreich erstellt.",
        "authCreateAccountError": "Ihr Konto konnte nicht erstellt werden.",
        "authEnterEmail": "Geben Sie Ihre E-Mail-Adresse ein.",
        "authSendingResetInstructions": "Anweisungen zum Zurücksetzen werden gesendet...",
        "authResetInstructionsSent": "Anweisungen zum Zurücksetzen des Passworts wurden gesendet.",
        "authRequestResetError": "Das Zurücksetzen des Passworts konnte nicht angefordert werden.",
        "authInvalidResetLink": "Dieser Link zum Zurücksetzen des Passworts ist ungültig oder fehlt.",
        "authPasswordMinLength": "Das Passwort muss mindestens 8 Zeichen lang sein.",
        "authResettingPassword": "Ihr Passwort wird zurückgesetzt...",
        "authResetPasswordError": "Ihr Passwort konnte nicht zurückgesetzt werden.",
        "authPasswordResetSuccess": "Ihr Passwort wurde erfolgreich zurückgesetzt."
    },

    "pt": {
        "authWelcome": "Bem-vindo ao Miimiid",
        "authSignInSubtitle": "Entre para continuar aprendendo",
        "authCreateAccount": "Crie sua conta Miimiid",
        "authCreateSubtitle": "Crie uma conta para começar a aprender",
        "authResetSubtitle": "Digite seu e-mail para receber instruções de redefinição de senha",
        "authPasswordMismatch": "As senhas não coincidem.",
        "authCreatingAccount": "Criando sua conta...",
        "authAccountCreated": "Conta criada com sucesso.",
        "authCreateAccountError": "Não foi possível criar sua conta.",
        "authEnterEmail": "Digite seu endereço de e-mail.",
        "authSendingResetInstructions": "Enviando instruções de redefinição...",
        "authResetInstructionsSent": "As instruções para redefinir a senha foram enviadas.",
        "authRequestResetError": "Não foi possível solicitar a redefinição da senha.",
        "authInvalidResetLink": "Este link de redefinição de senha é inválido ou está ausente.",
        "authPasswordMinLength": "A senha deve ter pelo menos 8 caracteres.",
        "authResettingPassword": "Redefinindo sua senha...",
        "authResetPasswordError": "Não foi possível redefinir sua senha.",
        "authPasswordResetSuccess": "Sua senha foi redefinida com sucesso."
    },

    "it": {
        "authWelcome": "Benvenuto su Miimiid",
        "authSignInSubtitle": "Accedi per continuare a imparare",
        "authCreateAccount": "Crea il tuo account Miimiid",
        "authCreateSubtitle": "Crea un account per iniziare a imparare",
        "authResetSubtitle": "Inserisci la tua e-mail per ricevere le istruzioni per reimpostare la password",
        "authPasswordMismatch": "Le password non coincidono.",
        "authCreatingAccount": "Creazione del tuo account...",
        "authAccountCreated": "Account creato con successo.",
        "authCreateAccountError": "Impossibile creare il tuo account.",
        "authEnterEmail": "Inserisci il tuo indirizzo e-mail.",
        "authSendingResetInstructions": "Invio delle istruzioni di reimpostazione...",
        "authResetInstructionsSent": "Le istruzioni per reimpostare la password sono state inviate.",
        "authRequestResetError": "Impossibile richiedere la reimpostazione della password.",
        "authInvalidResetLink": "Questo link per reimpostare la password non è valido o manca.",
        "authPasswordMinLength": "La password deve contenere almeno 8 caratteri.",
        "authResettingPassword": "Reimpostazione della password...",
        "authResetPasswordError": "Impossibile reimpostare la password.",
        "authPasswordResetSuccess": "La password è stata reimpostata correttamente."
    },

    "nl": {
        "authWelcome": "Welkom bij Miimiid",
        "authSignInSubtitle": "Log in om verder te leren",
        "authCreateAccount": "Maak je Miimiid-account",
        "authCreateSubtitle": "Maak een account om te beginnen met leren",
        "authResetSubtitle": "Voer je e-mailadres in om instructies voor het opnieuw instellen van je wachtwoord te ontvangen",
        "authPasswordMismatch": "De wachtwoorden komen niet overeen.",
        "authCreatingAccount": "Je account wordt aangemaakt...",
        "authAccountCreated": "Account succesvol aangemaakt.",
        "authCreateAccountError": "Je account kon niet worden aangemaakt.",
        "authEnterEmail": "Voer je e-mailadres in.",
        "authSendingResetInstructions": "Instructies voor het opnieuw instellen worden verzonden...",
        "authResetInstructionsSent": "De instructies voor het opnieuw instellen van je wachtwoord zijn verzonden.",
        "authRequestResetError": "Het opnieuw instellen van je wachtwoord kon niet worden aangevraagd.",
        "authInvalidResetLink": "Deze link voor het opnieuw instellen van je wachtwoord is ongeldig of ontbreekt.",
        "authPasswordMinLength": "Het wachtwoord moet minimaal 8 tekens bevatten.",
        "authResettingPassword": "Je wachtwoord wordt opnieuw ingesteld...",
        "authResetPasswordError": "Je wachtwoord kon niet opnieuw worden ingesteld.",
        "authPasswordResetSuccess": "Je wachtwoord is succesvol opnieuw ingesteld."
    },

    "pl": {
        "authWelcome": "Witamy w Miimiid",
        "authSignInSubtitle": "Zaloguj się, aby kontynuować naukę",
        "authCreateAccount": "Utwórz konto Miimiid",
        "authCreateSubtitle": "Utwórz konto, aby rozpocząć naukę",
        "authResetSubtitle": "Wpisz swój adres e-mail, aby otrzymać instrukcje resetowania hasła",
        "authPasswordMismatch": "Hasła nie są zgodne.",
        "authCreatingAccount": "Tworzenie konta...",
        "authAccountCreated": "Konto zostało pomyślnie utworzone.",
        "authCreateAccountError": "Nie udało się utworzyć konta.",
        "authEnterEmail": "Wpisz swój adres e-mail.",
        "authSendingResetInstructions": "Wysyłanie instrukcji resetowania...",
        "authResetInstructionsSent": "Instrukcje resetowania hasła zostały wysłane.",
        "authRequestResetError": "Nie udało się poprosić o reset hasła.",
        "authInvalidResetLink": "Ten link do resetowania hasła jest nieprawidłowy lub go brakuje.",
        "authPasswordMinLength": "Hasło musi mieć co najmniej 8 znaków.",
        "authResettingPassword": "Resetowanie hasła...",
        "authResetPasswordError": "Nie udało się zresetować hasła.",
        "authPasswordResetSuccess": "Hasło zostało pomyślnie zresetowane."
    },

    "tr": {
        "authWelcome": "Miimiid'e Hoş Geldiniz",
        "authSignInSubtitle": "Öğrenmeye devam etmek için giriş yapın",
        "authCreateAccount": "Miimiid hesabınızı oluşturun",
        "authCreateSubtitle": "Öğrenmeye başlamak için bir hesap oluşturun",
        "authResetSubtitle": "Şifre sıfırlama talimatlarını almak için e-posta adresinizi girin",
        "authPasswordMismatch": "Şifreler eşleşmiyor.",
        "authCreatingAccount": "Hesabınız oluşturuluyor...",
        "authAccountCreated": "Hesap başarıyla oluşturuldu.",
        "authCreateAccountError": "Hesabınız oluşturulamadı.",
        "authEnterEmail": "E-posta adresinizi girin.",
        "authSendingResetInstructions": "Sıfırlama talimatları gönderiliyor...",
        "authResetInstructionsSent": "Şifre sıfırlama talimatları gönderildi.",
        "authRequestResetError": "Şifre sıfırlama isteği gönderilemedi.",
        "authInvalidResetLink": "Bu şifre sıfırlama bağlantısı geçersiz veya eksik.",
        "authPasswordMinLength": "Şifre en az 8 karakter olmalıdır.",
        "authResettingPassword": "Şifreniz sıfırlanıyor...",
        "authResetPasswordError": "Şifreniz sıfırlanamadı.",
        "authPasswordResetSuccess": "Şifreniz başarıyla sıfırlandı."
    },

    "ru": {
        "authWelcome": "Добро пожаловать в Miimiid",
        "authSignInSubtitle": "Войдите, чтобы продолжить обучение",
        "authCreateAccount": "Создайте аккаунт Miimiid",
        "authCreateSubtitle": "Создайте аккаунт, чтобы начать обучение",
        "authResetSubtitle": "Введите адрес электронной почты, чтобы получить инструкции по сбросу пароля",
        "authPasswordMismatch": "Пароли не совпадают.",
        "authCreatingAccount": "Создание аккаунта...",
        "authAccountCreated": "Аккаунт успешно создан.",
        "authCreateAccountError": "Не удалось создать аккаунт.",
        "authEnterEmail": "Введите адрес электронной почты.",
        "authSendingResetInstructions": "Отправка инструкций по сбросу...",
        "authResetInstructionsSent": "Инструкции по сбросу пароля отправлены.",
        "authRequestResetError": "Не удалось запросить сброс пароля.",
        "authInvalidResetLink": "Эта ссылка для сброса пароля недействительна или отсутствует.",
        "authPasswordMinLength": "Пароль должен содержать не менее 8 символов.",
        "authResettingPassword": "Сброс пароля...",
        "authResetPasswordError": "Не удалось сбросить пароль.",
        "authPasswordResetSuccess": "Ваш пароль успешно сброшен."
    },

    "uk": {
        "authWelcome": "Ласкаво просимо до Miimiid",
        "authSignInSubtitle": "Увійдіть, щоб продовжити навчання",
        "authCreateAccount": "Створіть обліковий запис Miimiid",
        "authCreateSubtitle": "Створіть обліковий запис, щоб почати навчання",
        "authResetSubtitle": "Введіть адресу електронної пошти, щоб отримати інструкції зі скидання пароля",
        "authPasswordMismatch": "Паролі не збігаються.",
        "authCreatingAccount": "Створення облікового запису...",
        "authAccountCreated": "Обліковий запис успішно створено.",
        "authCreateAccountError": "Не вдалося створити обліковий запис.",
        "authEnterEmail": "Введіть адресу електронної пошти.",
        "authSendingResetInstructions": "Надсилання інструкцій зі скидання...",
        "authResetInstructionsSent": "Інструкції зі скидання пароля надіслано.",
        "authRequestResetError": "Не вдалося запросити скидання пароля.",
        "authInvalidResetLink": "Це посилання для скидання пароля недійсне або відсутнє.",
        "authPasswordMinLength": "Пароль має містити щонайменше 8 символів.",
        "authResettingPassword": "Скидання пароля...",
        "authResetPasswordError": "Не вдалося скинути пароль.",
        "authPasswordResetSuccess": "Ваш пароль успішно скинуто."
    },

    "ar": {
        "authWelcome": "مرحبًا بك في Miimiid",
        "authSignInSubtitle": "سجّل الدخول لمواصلة التعلّم",
        "authCreateAccount": "أنشئ حساب Miimiid الخاص بك",
        "authCreateSubtitle": "أنشئ حسابًا لبدء التعلّم",
        "authResetSubtitle": "أدخل بريدك الإلكتروني لتلقي تعليمات إعادة تعيين كلمة المرور",
        "authPasswordMismatch": "كلمتا المرور غير متطابقتين.",
        "authCreatingAccount": "جارٍ إنشاء حسابك...",
        "authAccountCreated": "تم إنشاء الحساب بنجاح.",
        "authCreateAccountError": "تعذر إنشاء حسابك.",
        "authEnterEmail": "أدخل عنوان بريدك الإلكتروني.",
        "authSendingResetInstructions": "جارٍ إرسال تعليمات إعادة التعيين...",
        "authResetInstructionsSent": "تم إرسال تعليمات إعادة تعيين كلمة المرور.",
        "authRequestResetError": "تعذر طلب إعادة تعيين كلمة المرور.",
        "authInvalidResetLink": "رابط إعادة تعيين كلمة المرور غير صالح أو مفقود.",
        "authPasswordMinLength": "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.",
        "authResettingPassword": "جارٍ إعادة تعيين كلمة المرور...",
        "authResetPasswordError": "تعذر إعادة تعيين كلمة المرور.",
        "authPasswordResetSuccess": "تمت إعادة تعيين كلمة المرور بنجاح."
    },

    "he": {
        "authWelcome": "ברוכים הבאים ל-Miimiid",
        "authSignInSubtitle": "התחבר כדי להמשיך ללמוד",
        "authCreateAccount": "צור את חשבון Miimiid שלך",
        "authCreateSubtitle": "צור חשבון כדי להתחיל ללמוד",
        "authResetSubtitle": "הזן את כתובת האימייל שלך כדי לקבל הוראות לאיפוס הסיסמה",
        "authPasswordMismatch": "הסיסמאות אינן תואמות.",
        "authCreatingAccount": "יוצר את החשבון שלך...",
        "authAccountCreated": "החשבון נוצר בהצלחה.",
        "authCreateAccountError": "לא ניתן ליצור את החשבון שלך.",
        "authEnterEmail": "הזן את כתובת האימייל שלך.",
        "authSendingResetInstructions": "שולח הוראות איפוס...",
        "authResetInstructionsSent": "הוראות לאיפוס הסיסמה נשלחו.",
        "authRequestResetError": "לא ניתן לבקש איפוס סיסמה.",
        "authInvalidResetLink": "קישור איפוס הסיסמה אינו תקין או חסר.",
        "authPasswordMinLength": "הסיסמה חייבת להכיל לפחות 8 תווים.",
        "authResettingPassword": "מאפס את הסיסמה שלך...",
        "authResetPasswordError": "לא ניתן לאפס את הסיסמה שלך.",
        "authPasswordResetSuccess": "הסיסמה שלך אופסה בהצלחה."
    },

    "fa": {
        "authWelcome": "به Miimiid خوش آمدید",
        "authSignInSubtitle": "برای ادامه یادگیری وارد شوید",
        "authCreateAccount": "حساب Miimiid خود را ایجاد کنید",
        "authCreateSubtitle": "برای شروع یادگیری یک حساب ایجاد کنید",
        "authResetSubtitle": "ایمیل خود را وارد کنید تا دستورالعمل بازنشانی رمز عبور را دریافت کنید",
        "authPasswordMismatch": "رمزهای عبور مطابقت ندارند.",
        "authCreatingAccount": "در حال ایجاد حساب شما...",
        "authAccountCreated": "حساب با موفقیت ایجاد شد.",
        "authCreateAccountError": "ایجاد حساب شما امکان‌پذیر نیست.",
        "authEnterEmail": "آدرس ایمیل خود را وارد کنید.",
        "authSendingResetInstructions": "در حال ارسال دستورالعمل بازنشانی...",
        "authResetInstructionsSent": "دستورالعمل بازنشانی رمز عبور ارسال شد.",
        "authRequestResetError": "درخواست بازنشانی رمز عبور امکان‌پذیر نیست.",
        "authInvalidResetLink": "این پیوند بازنشانی رمز عبور نامعتبر یا مفقود است.",
        "authPasswordMinLength": "رمز عبور باید حداقل ۸ نویسه داشته باشد.",
        "authResettingPassword": "در حال بازنشانی رمز عبور شما...",
        "authResetPasswordError": "بازنشانی رمز عبور شما امکان‌پذیر نیست.",
        "authPasswordResetSuccess": "رمز عبور شما با موفقیت بازنشانی شد."
    },

    "hi": {
        "authWelcome": "Miimiid में आपका स्वागत है",
        "authSignInSubtitle": "सीखना जारी रखने के लिए साइन इन करें",
        "authCreateAccount": "अपना Miimiid खाता बनाएं",
        "authCreateSubtitle": "सीखना शुरू करने के लिए खाता बनाएं",
        "authResetSubtitle": "पासवर्ड रीसेट करने के निर्देश पाने के लिए अपना ईमेल दर्ज करें",
        "authPasswordMismatch": "पासवर्ड मेल नहीं खाते।",
        "authCreatingAccount": "आपका खाता बनाया जा रहा है...",
        "authAccountCreated": "खाता सफलतापूर्वक बनाया गया।",
        "authCreateAccountError": "आपका खाता नहीं बनाया जा सका।",
        "authEnterEmail": "अपना ईमेल पता दर्ज करें।",
        "authSendingResetInstructions": "रीसेट निर्देश भेजे जा रहे हैं...",
        "authResetInstructionsSent": "पासवर्ड रीसेट करने के निर्देश भेज दिए गए हैं।",
        "authRequestResetError": "पासवर्ड रीसेट का अनुरोध नहीं किया जा सका।",
        "authInvalidResetLink": "यह पासवर्ड रीसेट लिंक अमान्य या अनुपलब्ध है।",
        "authPasswordMinLength": "पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।",
        "authResettingPassword": "आपका पासवर्ड रीसेट किया जा रहा है...",
        "authResetPasswordError": "आपका पासवर्ड रीसेट नहीं किया जा सका।",
        "authPasswordResetSuccess": "आपका पासवर्ड सफलतापूर्वक रीसेट कर दिया गया है।"
    },

    "bn": {
        "authWelcome": "Miimiid-এ স্বাগতম",
        "authSignInSubtitle": "শেখা চালিয়ে যেতে সাইন ইন করুন",
        "authCreateAccount": "আপনার Miimiid অ্যাকাউন্ট তৈরি করুন",
        "authCreateSubtitle": "শেখা শুরু করতে একটি অ্যাকাউন্ট তৈরি করুন",
        "authResetSubtitle": "পাসওয়ার্ড রিসেট করার নির্দেশনা পেতে আপনার ইমেল লিখুন",
        "authPasswordMismatch": "পাসওয়ার্ড দুটি মেলে না।",
        "authCreatingAccount": "আপনার অ্যাকাউন্ট তৈরি করা হচ্ছে...",
        "authAccountCreated": "অ্যাকাউন্ট সফলভাবে তৈরি হয়েছে।",
        "authCreateAccountError": "আপনার অ্যাকাউন্ট তৈরি করা যায়নি।",
        "authEnterEmail": "আপনার ইমেল ঠিকানা লিখুন।",
        "authSendingResetInstructions": "রিসেট নির্দেশনা পাঠানো হচ্ছে...",
        "authResetInstructionsSent": "পাসওয়ার্ড রিসেট করার নির্দেশনা পাঠানো হয়েছে।",
        "authRequestResetError": "পাসওয়ার্ড রিসেটের অনুরোধ করা যায়নি।",
        "authInvalidResetLink": "এই পাসওয়ার্ড রিসেট লিংকটি অবৈধ বা অনুপস্থিত।",
        "authPasswordMinLength": "পাসওয়ার্ডে কমপক্ষে ৮টি অক্ষর থাকতে হবে।",
        "authResettingPassword": "আপনার পাসওয়ার্ড রিসেট করা হচ্ছে...",
        "authResetPasswordError": "আপনার পাসওয়ার্ড রিসেট করা যায়নি।",
        "authPasswordResetSuccess": "আপনার পাসওয়ার্ড সফলভাবে রিসেট করা হয়েছে।"
    },

    "ur": {
        "authWelcome": "Miimiid میں خوش آمدید",
        "authSignInSubtitle": "سیکھنا جاری رکھنے کے لیے سائن ان کریں",
        "authCreateAccount": "اپنا Miimiid اکاؤنٹ بنائیں",
        "authCreateSubtitle": "سیکھنا شروع کرنے کے لیے اکاؤنٹ بنائیں",
        "authResetSubtitle": "پاس ورڈ دوبارہ ترتیب دینے کی ہدایات حاصل کرنے کے لیے اپنا ای میل درج کریں",
        "authPasswordMismatch": "پاس ورڈز مماثل نہیں ہیں۔",
        "authCreatingAccount": "آپ کا اکاؤنٹ بنایا جا رہا ہے...",
        "authAccountCreated": "اکاؤنٹ کامیابی سے بن گیا۔",
        "authCreateAccountError": "آپ کا اکاؤنٹ نہیں بنایا جا سکا۔",
        "authEnterEmail": "اپنا ای میل پتہ درج کریں۔",
        "authSendingResetInstructions": "ری سیٹ کی ہدایات بھیجی جا رہی ہیں...",
        "authResetInstructionsSent": "پاس ورڈ ری سیٹ کرنے کی ہدایات بھیج دی گئی ہیں۔",
        "authRequestResetError": "پاس ورڈ ری سیٹ کی درخواست نہیں کی جا سکی۔",
        "authInvalidResetLink": "یہ پاس ورڈ ری سیٹ لنک غلط یا موجود نہیں ہے۔",
        "authPasswordMinLength": "پاس ورڈ کم از کم 8 حروف کا ہونا چاہیے۔",
        "authResettingPassword": "آپ کا پاس ورڈ ری سیٹ کیا جا رہا ہے...",
        "authResetPasswordError": "آپ کا پاس ورڈ ری سیٹ نہیں کیا جا سکا۔",
        "authPasswordResetSuccess": "آپ کا پاس ورڈ کامیابی سے ری سیٹ ہو گیا ہے۔"
    },

    "id": {
        "authWelcome": "Selamat datang di Miimiid",
        "authSignInSubtitle": "Masuk untuk melanjutkan belajar",
        "authCreateAccount": "Buat akun Miimiid Anda",
        "authCreateSubtitle": "Buat akun untuk mulai belajar",
        "authResetSubtitle": "Masukkan email Anda untuk menerima petunjuk reset kata sandi",
        "authPasswordMismatch": "Kata sandi tidak cocok.",
        "authCreatingAccount": "Membuat akun Anda...",
        "authAccountCreated": "Akun berhasil dibuat.",
        "authCreateAccountError": "Akun Anda tidak dapat dibuat.",
        "authEnterEmail": "Masukkan alamat email Anda.",
        "authSendingResetInstructions": "Mengirim petunjuk reset...",
        "authResetInstructionsSent": "Petunjuk reset kata sandi telah dikirim.",
        "authRequestResetError": "Permintaan reset kata sandi tidak dapat dilakukan.",
        "authInvalidResetLink": "Tautan reset kata sandi ini tidak valid atau tidak tersedia.",
        "authPasswordMinLength": "Kata sandi harus terdiri dari setidaknya 8 karakter.",
        "authResettingPassword": "Mereset kata sandi Anda...",
        "authResetPasswordError": "Kata sandi Anda tidak dapat direset.",
        "authPasswordResetSuccess": "Kata sandi Anda berhasil direset."
    },

    "ms": {
        "authWelcome": "Selamat datang ke Miimiid",
        "authSignInSubtitle": "Log masuk untuk terus belajar",
        "authCreateAccount": "Cipta akaun Miimiid anda",
        "authCreateSubtitle": "Cipta akaun untuk mula belajar",
        "authResetSubtitle": "Masukkan e-mel anda untuk menerima arahan menetapkan semula kata laluan",
        "authPasswordMismatch": "Kata laluan tidak sepadan.",
        "authCreatingAccount": "Mencipta akaun anda...",
        "authAccountCreated": "Akaun berjaya dicipta.",
        "authCreateAccountError": "Akaun anda tidak dapat dicipta.",
        "authEnterEmail": "Masukkan alamat e-mel anda.",
        "authSendingResetInstructions": "Menghantar arahan tetapan semula...",
        "authResetInstructionsSent": "Arahan untuk menetapkan semula kata laluan telah dihantar.",
        "authRequestResetError": "Permintaan tetapan semula kata laluan tidak dapat dilakukan.",
        "authInvalidResetLink": "Pautan tetapan semula kata laluan ini tidak sah atau tiada.",
        "authPasswordMinLength": "Kata laluan mesti mempunyai sekurang-kurangnya 8 aksara.",
        "authResettingPassword": "Menetapkan semula kata laluan anda...",
        "authResetPasswordError": "Kata laluan anda tidak dapat ditetapkan semula.",
        "authPasswordResetSuccess": "Kata laluan anda berjaya ditetapkan semula."
    },

    "vi": {
        "authWelcome": "Chào mừng bạn đến với Miimiid",
        "authSignInSubtitle": "Đăng nhập để tiếp tục học",
        "authCreateAccount": "Tạo tài khoản Miimiid của bạn",
        "authCreateSubtitle": "Tạo tài khoản để bắt đầu học",
        "authResetSubtitle": "Nhập email để nhận hướng dẫn đặt lại mật khẩu",
        "authPasswordMismatch": "Mật khẩu không khớp.",
        "authCreatingAccount": "Đang tạo tài khoản của bạn...",
        "authAccountCreated": "Tạo tài khoản thành công.",
        "authCreateAccountError": "Không thể tạo tài khoản của bạn.",
        "authEnterEmail": "Nhập địa chỉ email của bạn.",
        "authSendingResetInstructions": "Đang gửi hướng dẫn đặt lại...",
        "authResetInstructionsSent": "Hướng dẫn đặt lại mật khẩu đã được gửi.",
        "authRequestResetError": "Không thể yêu cầu đặt lại mật khẩu.",
        "authInvalidResetLink": "Liên kết đặt lại mật khẩu này không hợp lệ hoặc bị thiếu.",
        "authPasswordMinLength": "Mật khẩu phải có ít nhất 8 ký tự.",
        "authResettingPassword": "Đang đặt lại mật khẩu của bạn...",
        "authResetPasswordError": "Không thể đặt lại mật khẩu của bạn.",
        "authPasswordResetSuccess": "Mật khẩu của bạn đã được đặt lại thành công."
    },

    "th": {
        "authWelcome": "ยินดีต้อนรับสู่ Miimiid",
        "authSignInSubtitle": "ลงชื่อเข้าใช้เพื่อเรียนรู้ต่อ",
        "authCreateAccount": "สร้างบัญชี Miimiid ของคุณ",
        "authCreateSubtitle": "สร้างบัญชีเพื่อเริ่มเรียนรู้",
        "authResetSubtitle": "ป้อนอีเมลของคุณเพื่อรับคำแนะนำในการรีเซ็ตรหัสผ่าน",
        "authPasswordMismatch": "รหัสผ่านไม่ตรงกัน",
        "authCreatingAccount": "กำลังสร้างบัญชีของคุณ...",
        "authAccountCreated": "สร้างบัญชีสำเร็จแล้ว",
        "authCreateAccountError": "ไม่สามารถสร้างบัญชีของคุณได้",
        "authEnterEmail": "ป้อนที่อยู่อีเมลของคุณ",
        "authSendingResetInstructions": "กำลังส่งคำแนะนำการรีเซ็ต...",
        "authResetInstructionsSent": "ส่งคำแนะนำในการรีเซ็ตรหัสผ่านแล้ว",
        "authRequestResetError": "ไม่สามารถขอรีเซ็ตรหัสผ่านได้",
        "authInvalidResetLink": "ลิงก์รีเซ็ตรหัสผ่านนี้ไม่ถูกต้องหรือไม่มีอยู่",
        "authPasswordMinLength": "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
        "authResettingPassword": "กำลังรีเซ็ตรหัสผ่านของคุณ...",
        "authResetPasswordError": "ไม่สามารถรีเซ็ตรหัสผ่านของคุณได้",
        "authPasswordResetSuccess": "รีเซ็ตรหัสผ่านของคุณสำเร็จแล้ว"
    },

    "zh": {
        "authWelcome": "欢迎来到 Miimiid",
        "authSignInSubtitle": "登录以继续学习",
        "authCreateAccount": "创建您的 Miimiid 账户",
        "authCreateSubtitle": "创建账户以开始学习",
        "authResetSubtitle": "输入您的电子邮件地址以接收密码重置说明",
        "authPasswordMismatch": "两次输入的密码不一致。",
        "authCreatingAccount": "正在创建您的账户...",
        "authAccountCreated": "账户创建成功。",
        "authCreateAccountError": "无法创建您的账户。",
        "authEnterEmail": "请输入您的电子邮件地址。",
        "authSendingResetInstructions": "正在发送重置说明...",
        "authResetInstructionsSent": "密码重置说明已发送。",
        "authRequestResetError": "无法请求密码重置。",
        "authInvalidResetLink": "此密码重置链接无效或缺失。",
        "authPasswordMinLength": "密码至少需要 8 个字符。",
        "authResettingPassword": "正在重置您的密码...",
        "authResetPasswordError": "无法重置您的密码。",
        "authPasswordResetSuccess": "您的密码已成功重置。"
    },

    "ja": {
        "authWelcome": "Miimiidへようこそ",
        "authSignInSubtitle": "サインインして学習を続ける",
        "authCreateAccount": "Miimiidアカウントを作成",
        "authCreateSubtitle": "アカウントを作成して学習を始めましょう",
        "authResetSubtitle": "パスワードリセットの手順を受け取るにはメールアドレスを入力してください",
        "authPasswordMismatch": "パスワードが一致しません。",
        "authCreatingAccount": "アカウントを作成しています...",
        "authAccountCreated": "アカウントが正常に作成されました。",
        "authCreateAccountError": "アカウントを作成できませんでした。",
        "authEnterEmail": "メールアドレスを入力してください。",
        "authSendingResetInstructions": "リセット手順を送信しています...",
        "authResetInstructionsSent": "パスワードリセットの手順を送信しました。",
        "authRequestResetError": "パスワードリセットをリクエストできませんでした。",
        "authInvalidResetLink": "このパスワードリセットリンクは無効または不足しています。",
        "authPasswordMinLength": "パスワードは8文字以上である必要があります。",
        "authResettingPassword": "パスワードをリセットしています...",
        "authResetPasswordError": "パスワードをリセットできませんでした。",
        "authPasswordResetSuccess": "パスワードが正常にリセットされました。"
    },

    "ko": {
        "authWelcome": "Miimiid에 오신 것을 환영합니다",
        "authSignInSubtitle": "로그인하여 학습을 계속하세요",
        "authCreateAccount": "Miimiid 계정 만들기",
        "authCreateSubtitle": "계정을 만들어 학습을 시작하세요",
        "authResetSubtitle": "비밀번호 재설정 안내를 받으려면 이메일을 입력하세요",
        "authPasswordMismatch": "비밀번호가 일치하지 않습니다.",
        "authCreatingAccount": "계정을 생성하는 중...",
        "authAccountCreated": "계정이 성공적으로 생성되었습니다.",
        "authCreateAccountError": "계정을 생성할 수 없습니다.",
        "authEnterEmail": "이메일 주소를 입력하세요.",
        "authSendingResetInstructions": "재설정 안내를 보내는 중...",
        "authResetInstructionsSent": "비밀번호 재설정 안내가 전송되었습니다.",
        "authRequestResetError": "비밀번호 재설정을 요청할 수 없습니다.",
        "authInvalidResetLink": "이 비밀번호 재설정 링크가 잘못되었거나 없습니다.",
        "authPasswordMinLength": "비밀번호는 8자 이상이어야 합니다.",
        "authResettingPassword": "비밀번호를 재설정하는 중...",
        "authResetPasswordError": "비밀번호를 재설정할 수 없습니다.",
        "authPasswordResetSuccess": "비밀번호가 성공적으로 재설정되었습니다."
    },

    "sw": {
        "authWelcome": "Karibu Miimiid",
        "authSignInSubtitle": "Ingia ili kuendelea kujifunza",
        "authCreateAccount": "Unda akaunti yako ya Miimiid",
        "authCreateSubtitle": "Unda akaunti ili kuanza kujifunza",
        "authResetSubtitle": "Weka barua pepe yako ili upokee maelekezo ya kuweka upya nenosiri",
        "authPasswordMismatch": "Nenosiri hazilingani.",
        "authCreatingAccount": "Akaunti yako inaundwa...",
        "authAccountCreated": "Akaunti imeundwa kwa mafanikio.",
        "authCreateAccountError": "Imeshindikana kuunda akaunti yako.",
        "authEnterEmail": "Weka anwani yako ya barua pepe.",
        "authSendingResetInstructions": "Inatuma maelekezo ya kuweka upya...",
        "authResetInstructionsSent": "Maelekezo ya kuweka upya nenosiri yametumwa.",
        "authRequestResetError": "Imeshindikana kuomba kuweka upya nenosiri.",
        "authInvalidResetLink": "Kiungo hiki cha kuweka upya nenosiri si sahihi au hakipo.",
        "authPasswordMinLength": "Nenosiri lazima liwe na angalau herufi 8.",
        "authResettingPassword": "Inaweka upya nenosiri lako...",
        "authResetPasswordError": "Imeshindikana kuweka upya nenosiri lako.",
        "authPasswordResetSuccess": "Nenosiri lako limewekwa upya kwa mafanikio."
    },

    "yo": {
        "authWelcome": "Kaabo si Miimiid",
        "authSignInSubtitle": "Wọlé láti tẹ̀síwájú nínú ẹ̀kọ́",
        "authCreateAccount": "Ṣẹ̀dá àkọọ́lẹ̀ Miimiid rẹ",
        "authCreateSubtitle": "Ṣẹ̀dá àkọọ́lẹ̀ láti bẹ̀rẹ̀ ẹ̀kọ́",
        "authResetSubtitle": "Tẹ imeeli rẹ sílẹ̀ láti gba àwọn ìtọ́sọ́nà fún títún ọ̀rọ̀ aṣínà ṣe",
        "authPasswordMismatch": "Àwọn ọ̀rọ̀ aṣínà kò bá ara wọn mu.",
        "authCreatingAccount": "A ń ṣẹ̀dá àkọọ́lẹ̀ rẹ...",
        "authAccountCreated": "A ti ṣẹ̀dá àkọọ́lẹ̀ náà ní àṣeyọrí.",
        "authCreateAccountError": "A kò lè ṣẹ̀dá àkọọ́lẹ̀ rẹ.",
        "authEnterEmail": "Tẹ àdírẹ́sì imeeli rẹ sílẹ̀.",
        "authSendingResetInstructions": "A ń rán àwọn ìtọ́sọ́nà títúnṣe...",
        "authResetInstructionsSent": "A ti rán àwọn ìtọ́sọ́nà títún ọ̀rọ̀ aṣínà ṣe.",
        "authRequestResetError": "A kò lè béèrè fún títún ọ̀rọ̀ aṣínà ṣe.",
        "authInvalidResetLink": "Ọ̀nà asopọ títún ọ̀rọ̀ aṣínà ṣe yìí kò wúlò tàbí ó sonù.",
        "authPasswordMinLength": "Ọ̀rọ̀ aṣínà gbọ́dọ̀ ní ó kéré tán àwọn àmì 8.",
        "authResettingPassword": "A ń tún ọ̀rọ̀ aṣínà rẹ ṣe...",
        "authResetPasswordError": "A kò lè tún ọ̀rọ̀ aṣínà rẹ ṣe.",
        "authPasswordResetSuccess": "A ti tún ọ̀rọ̀ aṣínà rẹ ṣe ní àṣeyọrí."
    },

    "ig": {
        "authWelcome": "Nnọọ na Miimiid",
        "authSignInSubtitle": "Banye ka ị gaa n'ihu n'ịmụ ihe",
        "authCreateAccount": "Mepụta akaụntụ Miimiid gị",
        "authCreateSubtitle": "Mepụta akaụntụ ka ịmalite ịmụ ihe",
        "authResetSubtitle": "Tinye email gị ka ịnata ntuziaka maka ịtọgharịa okwuntughe",
        "authPasswordMismatch": "Okwuntughe adabaghị.",
        "authCreatingAccount": "A na-emepụta akaụntụ gị...",
        "authAccountCreated": "Emepụtara akaụntụ nke ọma.",
        "authCreateAccountError": "Enweghị ike ịmepụta akaụntụ gị.",
        "authEnterEmail": "Tinye adreesị email gị.",
        "authSendingResetInstructions": "A na-eziga ntuziaka ịtọgharịa...",
        "authResetInstructionsSent": "E zigala ntuziaka ịtọgharịa okwuntughe.",
        "authRequestResetError": "Enweghị ike ịrịọ ka a tọgharịa okwuntughe.",
        "authInvalidResetLink": "Njikọ ịtọgharịa okwuntughe a ezighi ezi ma ọ bụ na-efu.",
        "authPasswordMinLength": "Okwuntughe ga-enwerịrị opekata mpe mkpụrụedemede 8.",
        "authResettingPassword": "A na-edozi okwuntughe gị ọzọ...",
        "authResetPasswordError": "Enweghị ike ịtọgharịa okwuntughe gị.",
        "authPasswordResetSuccess": "A tọgharịrị okwuntughe gị nke ọma."
    },

    "ha": {
        "authWelcome": "Barka da zuwa Miimiid",
        "authSignInSubtitle": "Shiga don ci gaba da koyo",
        "authCreateAccount": "Ƙirƙiri asusun Miimiid ɗinka",
        "authCreateSubtitle": "Ƙirƙiri asusu don fara koyo",
        "authResetSubtitle": "Shigar da imel ɗinka don karɓar umarnin sake saita kalmar sirri",
        "authPasswordMismatch": "Kalmomin sirri ba su dace ba.",
        "authCreatingAccount": "Ana ƙirƙirar asusunka...",
        "authAccountCreated": "An ƙirƙiri asusu cikin nasara.",
        "authCreateAccountError": "Ba a iya ƙirƙirar asusunka ba.",
        "authEnterEmail": "Shigar da adireshin imel ɗinka.",
        "authSendingResetInstructions": "Ana aika umarnin sake saiti...",
        "authResetInstructionsSent": "An aika umarnin sake saita kalmar sirri.",
        "authRequestResetError": "Ba a iya neman sake saita kalmar sirri ba.",
        "authInvalidResetLink": "Wannan hanyar haɗin sake saita kalmar sirri ba ta aiki ko ta ɓace.",
        "authPasswordMinLength": "Kalmar sirri dole ta kasance da aƙalla haruffa 8.",
        "authResettingPassword": "Ana sake saita kalmar sirrinka...",
        "authResetPasswordError": "Ba a iya sake saita kalmar sirrinka ba.",
        "authPasswordResetSuccess": "An sake saita kalmar sirrinka cikin nasara."
    }
}

# ---------------------------------------------------------
# Determine the language objects from the existing structure.
# ---------------------------------------------------------

lang_pattern = re.compile(
    r'(^\s{4}([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\{)',
    re.MULTILINE
)

matches = list(lang_pattern.finditer(text))

if not matches:
    raise SystemExit("ERROR: Could not locate MIIMIID translation language objects.")

updated = 0
missing = []

# Work backwards so offsets remain valid.
for i in range(len(matches) - 1, -1, -1):
    match = matches[i]
    lang = match.group(2)

    if lang not in translations:
        continue

    start = match.end()
    end = matches[i + 1].start() if i + 1 < len(matches) else text.find("\n  };", start)

    if end == -1:
        raise SystemExit(f"ERROR: Could not determine end of translation object: {lang}")

    block = text[start:end]

    # Add only if these keys are not already present.
    if "authWelcome:" in block:
        continue

    # Insert the new authentication keys without depending on any
    # pre-existing authResetPasswordSubtitle anchor. This keeps the
    # patch compatible with every existing language dictionary.

    additions = "\n"
    for key, value in translations[lang].items():
        # Do not create duplicate translation keys.
        if re.search(
            rf'^\\s*{re.escape(key)}\\s*:',
            block,
            re.MULTILINE
        ):
            continue

        escaped = value.replace("\\\\", "\\\\\\").replace("'", "\\'")
        additions += f"      {key}: '{escaped}',\\n"

    if not additions.strip():
        continue

    # Insert immediately after the opening brace of the language object.
    block = additions + block

    text = text[:start] + block + text[end:]
    updated += 1

if missing:
    raise SystemExit(
        "ERROR: Missing authResetPasswordSubtitle anchor in: "
        + ", ".join(missing)
    )

# ---------------------------------------------------------
# 2. Replace auth mode title/subtitle calls remain dynamic.
#    These already exist; no DOM changes are necessary.
# ---------------------------------------------------------

# ---------------------------------------------------------
# 3. Replace hardcoded runtime auth messages.
# ---------------------------------------------------------

replacements = {
    '"Passwords do not match."':
        'miimiidDashboardTranslate("authPasswordMismatch")',

    '"Creating your account..."':
        'miimiidDashboardTranslate("authCreatingAccount")',

    '"Account created successfully."':
        'miimiidDashboardTranslate("authAccountCreated")',

    '"Unable to create your account."':
        'miimiidDashboardTranslate("authCreateAccountError")',

    '"Enter your email address."':
        'miimiidDashboardTranslate("authEnterEmail")',

    '"Sending reset instructions..."':
        'miimiidDashboardTranslate("authSendingResetInstructions")',

    '"Unable to request password reset."':
        'miimiidDashboardTranslate("authRequestResetError")',

    '"Password reset instructions have been sent."':
        'miimiidDashboardTranslate("authResetInstructionsSent")',

    '"This password reset link is invalid or missing."':
        'miimiidDashboardTranslate("authInvalidResetLink")',

    '"Password must be at least 8 characters."':
        'miimiidDashboardTranslate("authPasswordMinLength")',

    '"Resetting your password..."':
        'miimiidDashboardTranslate("authResettingPassword")',

    '"Unable to reset your password."':
        'miimiidDashboardTranslate("authResetPasswordError")',

    '"Your password has been reset successfully."':
        'miimiidDashboardTranslate("authPasswordResetSuccess")',
}

for old, new in replacements.items():
    text = text.replace(old, new)

# ---------------------------------------------------------
# 4. Localize known backend fallback messages without
#    destroying genuine backend messages.
# ---------------------------------------------------------

old_request = '''result &&
            result.message
              ? result.message
              : miimiidDashboardTranslate("authRequestResetError")'''

new_request = '''result &&
            result.message
              ? result.message
              : miimiidDashboardTranslate("authRequestResetError")'''

# Keep genuine server messages untouched. The client fallback is localized.

# ---------------------------------------------------------
# 5. Write result.
# ---------------------------------------------------------

path.write_text(text, encoding="utf-8")

print(f"Auth localization patch applied to {updated} language dictionaries.")
print("Updated public/index.html")
