from pathlib import Path
import re

path = Path("public/index.html")
text = path.read_text(encoding="utf-8")

original = text

# ---------------------------------------------------------
# 1. Make reset-mode title/subtitle localization-aware.
# ---------------------------------------------------------

text = text.replace(
'''        } else if (mode === "reset") {
          title.textContent = "Reset your password";
        } else {''',
'''        } else if (mode === "reset") {
          title.textContent =
            miimiidDashboardTranslate("authResetPasswordTitle");
        } else {''',
1
)

text = text.replace(
'''        } else if (mode === "reset") {
          subtitle.textContent =
            "Choose a new password for your Miimiid account.";
        } else {''',
'''        } else if (mode === "reset") {
          subtitle.textContent =
            miimiidDashboardTranslate("authResetPasswordSubtitle");
        } else {''',
1
)

# ---------------------------------------------------------
# 2. Moderate authentication secondary-link typography.
# ---------------------------------------------------------

old_css = '''    .miimiid-auth-link {
      background: none;
      border: none;
      color: #38bdf8;
      cursor: pointer;
      padding: 9px 0;
      font-size: 0.95rem;
      font-weight: bold;
    }'''

new_css = '''    .miimiid-auth-link {
      background: none;
      border: none;
      color: #38bdf8;
      cursor: pointer;
      padding: 9px 0;
      font-size: 1rem;
      font-weight: bold;
    }'''

if old_css in text:
    text = text.replace(old_css, new_css, 1)
elif 'font-size: 1rem;' not in text[text.find('.miimiid-auth-link'):text.find('.miimiid-auth-link') + 500]:
    raise SystemExit("AUTH PATCH FAILED: auth-link CSS block not found.")

# ---------------------------------------------------------
# 3. Add reset-specific localization keys to every existing
#    language dictionary by extending each dictionary only
#    when the key does not already exist.
#
#    We locate language object boundaries from the existing
#    MIIMIID_TRANSLATIONS declaration rather than guessing
#    the number of languages.
# ---------------------------------------------------------

translation_start = text.find("const MIIMIID_TRANSLATIONS")
if translation_start == -1:
    raise SystemExit("AUTH PATCH FAILED: MIIMIID_TRANSLATIONS not found.")

translation_end = text.find("function", translation_start)
if translation_end == -1:
    translation_end = len(text)

translation_block = text[translation_start:translation_end]

languages = [
    ("en", "Reset your password", "Choose a new password for your Miimiid account."),
    ("es", "Restablece tu contraseña", "Elige una nueva contraseña para tu cuenta de Miimiid."),
    ("fr", "Réinitialisez votre mot de passe", "Choisissez un nouveau mot de passe pour votre compte Miimiid."),
    ("de", "Passwort zurücksetzen", "Wählen Sie ein neues Passwort für Ihr Miimiid-Konto."),
    ("pt", "Redefina sua senha", "Escolha uma nova senha para sua conta Miimiid."),
    ("it", "Reimposta la password", "Scegli una nuova password per il tuo account Miimiid."),
    ("nl", "Wachtwoord opnieuw instellen", "Kies een nieuw wachtwoord voor je Miimiid-account."),
    ("ru", "Сбросить пароль", "Выберите новый пароль для своей учетной записи Miimiid."),
    ("uk", "Скинути пароль", "Виберіть новий пароль для свого облікового запису Miimiid."),
    ("pl", "Zresetuj hasło", "Wybierz nowe hasło do swojego konta Miimiid."),
    ("tr", "Şifrenizi sıfırlayın", "Miimiid hesabınız için yeni bir şifre seçin."),
    ("ar", "إعادة تعيين كلمة المرور", "اختر كلمة مرور جديدة لحساب Miimiid الخاص بك."),
    ("he", "איפוס הסיסמה", "בחר סיסמה חדשה לחשבון Miimiid שלך."),
    ("fa", "بازنشانی رمز عبور", "یک رمز عبور جدید برای حساب Miimiid خود انتخاب کنید."),
    ("hi", "पासवर्ड रीसेट करें", "अपने Miimiid खाते के लिए नया पासवर्ड चुनें।"),
    ("bn", "পাসওয়ার্ড রিসেট করুন", "আপনার Miimiid অ্যাকাউন্টের জন্য একটি নতুন পাসওয়ার্ড বেছে নিন।"),
    ("ur", "پاس ورڈ دوبارہ ترتیب دیں", "اپنے Miimiid اکاؤنٹ کے لیے نیا پاس ورڈ منتخب کریں۔"),
    ("zh", "重置密码", "为您的 Miimiid 账户选择一个新密码。"),
    ("ja", "パスワードをリセット", "Miimiidアカウントの新しいパスワードを選択してください。"),
    ("ko", "비밀번호 재설정", "Miimiid 계정의 새 비밀번호를 선택하세요."),
    ("vi", "Đặt lại mật khẩu", "Chọn mật khẩu mới cho tài khoản Miimiid của bạn."),
    ("id", "Atur ulang kata sandi", "Pilih kata sandi baru untuk akun Miimiid Anda."),
    ("ms", "Tetapkan semula kata laluan", "Pilih kata laluan baharu untuk akaun Miimiid anda."),
    ("sw", "Weka upya nenosiri", "Chagua nenosiri jipya la akaunti yako ya Miimiid."),
    ("yo", "Tun ọrọigbaniwọle ṣe", "Yan ọrọigbaniwọle tuntun fun akọọlẹ Miimiid rẹ."),
    ("ha", "Sake saita kalmar sirri", "Zaɓi sabuwar kalmar sirri don asusun Miimiid ɗinka."),
    ("ig", "Tọgharịa okwuntughe", "Họrọ okwuntughe ọhụrụ maka akaụntụ Miimiid gị."),
    ("am", "የይለፍ ቃል ዳግም አስጀምር", "ለMiimiid መለያዎ አዲስ የይለፍ ቃል ይምረጡ።"),
]

# Rather than assuming every language exists, only patch keys
# inside language blocks that are actually present.
for lang, title_value, subtitle_value in languages:
    # Find the language object's opening.
    pattern = re.compile(
        r'(["\']?' + re.escape(lang) + r'["\']?\s*:\s*\{)'
    )
    match = pattern.search(translation_block)

    if not match:
        continue

    start = match.end()

    # Find the next language object at the same simple dictionary level.
    # The translation dictionaries in this file use language keys followed
    # by object literals; locating the next "\n    xx:" boundary is safer
    # than global replacement.
    next_match = re.search(
        r'\n\s{4,8}["\']?[A-Za-z]{2,5}["\']?\s*:\s*\{',
        translation_block[start:]
    )

    end = start + next_match.start() if next_match else len(translation_block)

    block = translation_block[start:end]

    if "authResetPasswordTitle" not in block:
        insertion = (
            f'\n      authResetPasswordTitle: {title_value!r},'
            f'\n      authResetPasswordSubtitle: {subtitle_value!r},'
        )

        # Insert immediately after the opening of the dictionary.
        translation_block = (
            translation_block[:start]
            + insertion
            + translation_block[start:]
        )

# Rebuild the document with the modified translation block.
text = (
    text[:translation_start]
    + translation_block
    + text[translation_start + len(text[translation_start:translation_end]):]
    if translation_end != len(text)
    else text[:translation_start] + translation_block
)

# ---------------------------------------------------------
# 4. Verify the important source changes before writing.
# ---------------------------------------------------------

required_fragments = [
    'miimiidDashboardTranslate("authResetPasswordTitle")',
    'miimiidDashboardTranslate("authResetPasswordSubtitle")',
    'font-size: 1rem;',
]

for fragment in required_fragments:
    if fragment not in text:
        raise SystemExit(
            f"AUTH PATCH FAILED: required change missing: {fragment}"
        )

if text == original:
    raise SystemExit("AUTH PATCH FAILED: no changes were made.")

path.write_text(text, encoding="utf-8")
print("MIIMIID AUTH #2 PATCH: APPLIED")
