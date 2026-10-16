/* =========================================================
   MIIMIID DRAWER: content for the menu pages
   Edit the text here. public/drawer.js builds the screens.
   ========================================================= */
window.MIIMIID_DRAWER_CONFIG = {
  // Put your real support email between the quotes, for example "help@yourdomain.com".
  // While it is empty, the "Email support" button is not shown.
  supportEmail: ""
};

window.MIIMIID_DRAWER_PAGES = {

  /* ---------- Miimiid Pro: shown as "Coming soon" ---------- */
  proFeatures: [
    { title: "Higher AI Tutor limit", text: "More AI Tutor chats every day." },
    { title: "More Fun Center content", text: "Extra games and challenges to practise with." },
    { title: "Deeper learning paths", text: "Extra lessons and guided plans for your goals." }
  ],

  /* ---------- Support center ---------- */
  faq: [
    {
      q: "I forgot my password",
      a: "On the sign-in screen, use the forgot password option. We will send a code to your email so you can set a new password."
    },
    {
      q: "The AI Tutor is not answering",
      a: "Check your internet connection and try again. If it keeps happening, the tutor may be busy for a moment, so try again in a few minutes. There is also a daily limit on tutor chats."
    },
    {
      q: "The app is slow to open",
      a: "If the app has not been used for a while, the server can take up to a minute to wake up. After that it is fast again."
    },
    {
      q: "Is Miimiid financial advice?",
      a: "No. The lessons, quizzes and the AI Tutor are for general education only. They are not personal financial, investment, tax or legal advice."
    },
    {
      q: "How do I change the language?",
      a: "Open the menu, tap Settings, then choose your language."
    },
    {
      q: "How do I sign out?",
      a: "Open the menu and tap Sign out at the bottom."
    }
  ],

  /* ---------- Privacy policy ---------- */
  privacy:
    '<h2>Privacy Policy</h2>' +
    '<p class="mm-updated">Last updated: October 16, 2026</p>' +
    '<p>This policy explains what Miimiid collects, why we collect it, and the choices you have.</p>' +
    '<h3>What we collect</h3>' +
    '<ul>' +
      '<li>Account details: your name, your email address and your sign-in details.</li>' +
      '<li>Learning activity: the lessons you complete, quiz results, XP, streaks and Fun Center progress.</li>' +
      '<li>AI Tutor conversations: the messages you send to the AI Tutor and the answers you receive.</li>' +
      '<li>Basic technical data that your device sends when it connects to our servers.</li>' +
    '</ul>' +
    '<h3>How we use it</h3>' +
    '<ul>' +
      '<li>To create your account, keep it secure and sign you in.</li>' +
      '<li>To save your progress and show your stats.</li>' +
      '<li>To provide the AI Tutor and keep the service working and safe.</li>' +
    '</ul>' +
    '<h3>AI Tutor and other services</h3>' +
    '<p>To answer your questions, the AI Tutor sends your message, your recent chat history and the lesson you are viewing to an AI provider (OpenAI). Please do not share passwords, card numbers or other sensitive personal details in the chat.</p>' +
    '<p>If you sign in with Google, Google shares your basic profile details with us so we can create your account.</p>' +
    '<h3>Your choices</h3>' +
    '<ul>' +
      '<li>You can choose your language in Settings and sign out at any time.</li>' +
      '<li>To ask about your data or to request deletion of your account, contact us through the Support center.</li>' +
    '</ul>' +
    '<h3>Changes to this policy</h3>' +
    '<p>We may update this policy from time to time. The date at the top shows the latest version.</p>' +
    '<h3>Contact</h3>' +
    '<p>Questions about privacy? Use the Support center in the menu.</p>',

  /* ---------- Terms & conditions ---------- */
  terms:
    '<h2>Terms &amp; Conditions</h2>' +
    '<p class="mm-updated">Last updated: October 16, 2026</p>' +
    '<p>Miimiid is a financial learning app. By using it, you agree to these terms.</p>' +
    '<h3>Education only</h3>' +
    '<p>Lessons, quizzes and the AI Tutor are for general education. They are not financial, investment, tax or legal advice. Think about your own situation, and speak to a qualified professional before you make important money decisions.</p>' +
    '<h3>The AI Tutor</h3>' +
    '<p>The AI Tutor can make mistakes. Check important information before you act on it, and do not rely on it for decisions that could seriously affect your finances.</p>' +
    '<h3>Your account</h3>' +
    '<ul>' +
      '<li>Keep your sign-in details private.</li>' +
      '<li>You are responsible for activity on your account.</li>' +
      '<li>Give us accurate information when you register.</li>' +
    '</ul>' +
    '<h3>Acceptable use</h3>' +
    '<p>Do not misuse Miimiid. That includes trying to break, overload or gain unauthorized access to the service, using it unlawfully, or harassing other people.</p>' +
    '<h3>Changes and availability</h3>' +
    '<p>We may change, pause or stop features at any time, and we may add limits, such as a daily limit on AI Tutor chats.</p>' +
    '<h3>Liability</h3>' +
    '<p>Miimiid is provided as is. To the extent the law allows, we are not responsible for losses that result from using the app or acting on its content.</p>' +
    '<h3>Contact</h3>' +
    '<p>Questions about these terms? Use the Support center in the menu.</p>'
};
