/* =========================================================
   MIIMIID DRAWER: content for the menu pages
   Edit the text here. public/drawer.js builds the screens.
   ========================================================= */
window.MIIMIID_DRAWER_CONFIG = {
  // Shows the "Email support" button. Leave "" to hide it.
  supportEmail: "williecarino23@gmail.com"
};

window.MIIMIID_DRAWER_PAGES = {

  /* ---------- Miimiid Pro: shown as "Coming soon" ---------- */
  proFeatures: [
    { title: "Higher AI Tutor limit", text: "More AI Tutor chats every day." },
    { title: "More Fun Center content", text: "Extra games and challenges to practise with." },
    { title: "Deeper learning paths", text: "Extra lessons and guided plans for your goals." }
  ],

  /* ---------- Support center ---------- */
  supportIntro: {
    title: "Welcome to Miimiid Support",
    lead: "We're here to help you move forward.",
    text: `At Miimiid, we believe that learning about money should feel simple, empowering, and accessible to everyone. Whether you're exploring financial literacy for the first time, working through a lesson, using our AI Tutor, or experiencing a technical issue, we're here to help you get the most out of your experience.
Our Support Center is your starting point for finding answers, understanding how Miimiid works, and getting assistance when you need it.
Your questions matter. Your experience matters. And we're committed to helping you make the most of Miimiid.`
  },

  supportCommitment: {
    title: "Our commitment to you",
    text: `At Miimiid, we want every user to feel welcome, respected, and supported.
We aim to:
- Treat support requests respectfully.
- Communicate clearly and honestly.
- Help users understand available features.
- Investigate reported problems.
- Protect users' personal information.
- Improve the platform based on useful feedback.
Thank you for being part of Miimiid.
Your journey toward better financial knowledge matters to us.
Miimiid: Smart Choices. Brighter Tomorrows.`
  },

  faq: [
    {
      q: "How do I contact support?",
      a: "Tap Email support below. Describe what happened and what you expected to happen, and include a screenshot if you can, as long as it doesn't show private information. We will aim to respond as promptly as reasonably possible. Response times may vary depending on the nature and complexity of your request."
    },
    {
      q: "I forgot my password",
      a: "On the sign-in screen, use the forgot password option. We will send a code to your email so you can set a new password. Never send your password or verification code to anyone claiming to be a support representative."
    },
    {
      q: "I did not receive my verification code",
      a: "Check your spam folder and make sure your email address was typed correctly, then try again. If the code still does not arrive, contact us and tell us which email address you used."
    },
    {
      q: "My lesson or progress looks wrong",
      a: "If a lesson isn't loading correctly or your progress appears incorrect, contact us and tell us which course and lesson you were in. We want every learning session to bring you one step closer to making informed financial decisions."
    },
    {
      q: "The AI Tutor is not working or gave a wrong answer",
      a: "Check your internet connection and try again. If it keeps happening, tell us what happened and what you expected. AI-generated information can sometimes be incomplete or inaccurate, so for important financial decisions, verify the information and consider seeking qualified professional advice. Please do not send passwords, verification codes, or sensitive financial information in the chat."
    },
    {
      q: "A game will not load or my rewards look wrong",
      a: "If a game fails to load, a session doesn't work as expected, or your progress or rewards appear incorrect, contact us with a description of the problem and which game it was."
    },
    {
      q: "The app shows a blank screen or is slow",
      a: "If the app has not been used for a while, it can take up to a minute to wake up. After that it is fast again. If you still see a blank screen, an error, or a feature that isn't responding, tell us what you were trying to do, what happened instead, and whether it happens every time."
    },
    {
      q: "How do I change the language?",
      a: "Open the menu, tap Settings, then choose your language."
    },
    {
      q: "How do I sign out?",
      a: "Open the menu and tap Sign out at the bottom."
    },
    {
      q: "Is Miimiid financial advice?",
      a: "No. Lessons, quizzes and the AI Tutor are for general education only. They are not personal financial, investment, tax or legal advice."
    },
    {
      q: "How do I report a privacy or security problem?",
      a: "Contact us through Email support. Never include your password, authentication codes, or complete payment credentials in a support request."
    }
  ],

  /* ---------- Privacy policy ---------- */
  privacy: `
<h2>Your Privacy Matters to Us</h2>
<p class="mm-updated">Effective date: October 16, 2026</p>
<p>At Miimiid Financial Academy ("Miimiid," "we," "our," or "us"), we respect your privacy and are committed to handling personal information responsibly.</p>
<p>This Privacy Policy explains what information we may collect, how we use it, when we may share it, how we protect it, and what choices may be available to you when you use our website, mobile application, learning services, AI Tutor, and interactive features.</p>
<p>We believe you should understand how your information is handled without needing to interpret complicated legal language.</p>
<p>Please read this policy carefully.</p>

<h3>1. Information We Collect</h3>
<p>The information we collect depends on how you use Miimiid and which features you access.</p>

<p><strong>1.1 Information You Provide</strong></p>
<p>When you create or manage an account, you may provide information such as:</p>
<ul>
<li>First and last name.</li>
<li>Email address.</li>
<li>Date of birth.</li>
<li>Gender, if requested by the registration process.</li>
<li>Account credentials and authentication information.</li>
<li>Information you submit when contacting support.</li>
</ul>
<p>You should only provide information requested by the relevant feature and avoid sharing unnecessary sensitive information.</p>

<p><strong>1.2 Learning and Activity Information</strong></p>
<p>To provide and improve your learning experience, Miimiid may process information such as:</p>
<ul>
<li>Courses and lessons you access.</li>
<li>Lesson completion and learning progress.</li>
<li>Quiz attempts and results.</li>
<li>Achievements, points, or experience earned.</li>
<li>Fun Center activity and game-session results.</li>
<li>Preferences associated with your learning experience.</li>
</ul>
<p>This information helps the application provide relevant functionality and maintain your learning progress.</p>

<p><strong>1.3 AI Tutor Conversations</strong></p>
<p>When you interact with Miimiid AI Tutor, the information you submit may be processed to generate responses.</p>
<p>Depending on the implementation and services used, this may include your questions, conversation history, and relevant contextual information.</p>
<p>Please do not submit passwords, authentication codes, complete payment credentials, or other highly sensitive information to the AI Tutor.</p>

<p><strong>1.4 Technical Information</strong></p>
<p>When you use Miimiid, certain technical information may be collected or generated, depending on your device, browser, hosting environment, and application configuration.</p>
<p>This may include:</p>
<ul>
<li>Device and browser information.</li>
<li>Operating system information.</li>
<li>IP address and general connection information.</li>
<li>Application error reports.</li>
<li>Security and diagnostic logs.</li>
<li>Information about requests made to our services.</li>
</ul>
<p>We use relevant technical information to operate the platform, troubleshoot problems, protect accounts, and improve reliability.</p>

<p><strong>1.5 Information We Do Not Automatically Assume We Collect</strong></p>
<p>Miimiid does not need unrestricted access to your personal life to provide financial education.</p>
<p>Whether we collect additional information, such as payment details, location information, or information from third-party accounts, depends on the features actually implemented and the permissions or integrations you use.</p>
<p>We will not describe information as collected or protected by a particular mechanism unless that description reflects our actual practices.</p>

<h3>2. How We Use Your Information</h3>
<p>We may use personal information for legitimate purposes associated with providing Miimiid, including:</p>
<ul>
<li><strong>Account management:</strong> Creating accounts, authenticating users, maintaining sessions, and providing account-related features.</li>
<li><strong>Learning services:</strong> Delivering lessons, recording progress, calculating results, and supporting educational activities.</li>
<li><strong>AI Tutor functionality:</strong> Processing questions and relevant context to generate responses.</li>
<li><strong>Application improvement:</strong> Diagnosing errors, improving performance, and evaluating the reliability of features.</li>
<li><strong>Security:</strong> Detecting suspicious activity, preventing abuse, protecting accounts, and maintaining platform integrity.</li>
<li><strong>Support:</strong> Responding to inquiries, investigating reported problems, and communicating about support requests.</li>
<li><strong>Legal compliance:</strong> Meeting applicable legal obligations and responding to lawful requests where required.</li>
</ul>
<p>We will use information in ways consistent with this policy and applicable law.</p>

<h3>3. How We Share Information</h3>
<p>We do not treat personal information as something to share indiscriminately.</p>
<p>Information may be disclosed in limited circumstances, including the following.</p>
<p><strong>Service Providers</strong></p>
<p>We may use third-party providers to operate Miimiid, such as hosting platforms, database providers, email delivery services, or AI model providers.</p>
<p>Those providers may process relevant information to deliver their services, subject to the applicable arrangements and legal requirements.</p>
<p><strong>Legal Requirements</strong></p>
<p>We may disclose information when required by applicable law, a valid legal process, or a lawful request from an authorized authority.</p>
<p><strong>Security and Protection</strong></p>
<p>We may disclose information when reasonably necessary to investigate security incidents, address fraud or abuse, protect users, or safeguard our legal rights, subject to applicable law.</p>
<p><strong>Business Transfers</strong></p>
<p>If Miimiid undergoes a merger, acquisition, restructuring, or transfer of assets, personal information may be involved in that transaction, subject to applicable legal protections.</p>
<p>We do not claim that information is never shared with third parties. Our disclosures must reflect the actual services and circumstances involved.</p>

<h3>4. Data Storage and Security</h3>
<p>We use appropriate technical and organizational measures intended to protect personal information against unauthorized access, loss, misuse, alteration, and disclosure.</p>
<p>Depending on the implementation, these measures may include access controls, authentication protections, secure communications, and restricted access to systems.</p>
<p>However, no internet-based service can guarantee absolute security.</p>
<p>We encourage users to protect their account credentials, avoid sharing authentication codes, and report suspected account compromise promptly.</p>

<h3>5. Data Retention</h3>
<p>We retain personal information for as long as reasonably necessary for the purposes described in this policy, including providing services, maintaining learning records, meeting legal obligations, resolving disputes, and protecting the platform.</p>
<p>Retention periods may vary depending on the information involved and the reason it is processed.</p>
<p>Where information is no longer required, we will take appropriate steps to delete it, anonymize it, or otherwise dispose of it in accordance with applicable law and our retention practices.</p>
<p>You may contact us to ask about the retention of your information or available deletion options.</p>

<h3>6. Your Privacy Rights and Choices</h3>
<p>Depending on your location and applicable law, you may have rights to:</p>
<ul>
<li>Request access to your personal information.</li>
<li>Request correction of inaccurate information.</li>
<li>Request deletion of certain personal information.</li>
<li>Object to or restrict certain processing.</li>
<li>Withdraw consent where processing relies on consent.</li>
<li>Request a copy of certain information in a portable format.</li>
<li>Complain to an appropriate data protection authority.</li>
</ul>
<p>These rights may be subject to legal exceptions.</p>
<p>To submit a privacy request, contact us using the details provided below. We may need to verify your identity before acting on the request.</p>

<h3>7. Children's Privacy</h3>
<p>Miimiid is a financial education platform, but that does not automatically mean every feature is suitable for every age group.</p>
<p>Our registration requirements, age restrictions, and practices for handling children's information must comply with applicable law.</p>
<p>If Miimiid is available to children, the appropriate safeguards, parental-consent requirements, and age-appropriate privacy practices must be implemented where required.</p>
<p>If you believe a child has provided personal information in circumstances that violate applicable requirements, please contact us.</p>

<h3>8. International Data Transfers</h3>
<p>Depending on the hosting infrastructure and service providers used, personal information may be processed or stored in countries other than your country of residence.</p>
<p>Where international transfers occur, we will take the steps required by applicable law to provide appropriate protection for the information transferred.</p>

<h3>9. Third-Party Services</h3>
<p>Miimiid may rely on third-party services to provide certain functions.</p>
<p>Those services may have their own privacy policies and practices.</p>
<p>Where relevant, we encourage users to review the applicable policies of those providers.</p>
<p>Our use of a third-party service does not mean we control every aspect of that provider's data processing.</p>

<h3>10. Changes to This Privacy Policy</h3>
<p>We may update this Privacy Policy as Miimiid evolves, our practices change, or legal requirements develop.</p>
<p>When changes are made, we will update the effective date and provide additional notice where required.</p>
<p>We encourage users to review this page periodically.</p>

<h3>11. Contact Us</h3>
<p>For questions about this Privacy Policy, personal information, or privacy requests, contact:</p>
<p>Miimiid Financial Academy<br>Use the Support center in the menu to reach us.</p>
<p>We will handle privacy inquiries in accordance with applicable legal requirements.</p>
<p><em>Miimiid: Smart Choices. Brighter Tomorrows.</em></p>`,

  /* ---------- Terms & conditions ---------- */
  terms: `
<h2>Welcome to Miimiid Financial Academy</h2>
<p class="mm-updated">Effective date: October 16, 2026</p>
<p>Welcome to Miimiid.</p>
<p>These Terms &amp; Conditions ("Terms") govern your access to and use of the Miimiid website, mobile application, educational content, AI Tutor, interactive games, and related services.</p>
<p>By accessing or using Miimiid, you agree to these Terms where legally permitted and applicable. If you do not agree, please discontinue use of the services.</p>
<p>If you are not legally able to agree to these Terms on your own behalf, any required consent must be obtained from an authorized parent, guardian, or other legally authorized person, as applicable.</p>

<h3>1. About Miimiid</h3>
<p>Miimiid Financial Academy is designed to make financial literacy more accessible through practical education, interactive learning experiences, and technology-assisted guidance.</p>
<p>Our services may include:</p>
<ul>
<li>Financial literacy courses and lessons.</li>
<li>Quizzes, assessments, and learning-progress features.</li>
<li>Miimiid AI Tutor.</li>
<li>Fun Center games and activities.</li>
<li>User accounts and profile settings.</li>
<li>Additional features introduced over time.</li>
</ul>
<p>The availability of particular features may depend on your account, location, subscription status, or the current version of the application.</p>

<h3>2. Eligibility and Accounts</h3>
<p>To use account-based features, you must provide information that is accurate to the best of your knowledge and keep it reasonably up to date.</p>
<p>You are responsible for maintaining the confidentiality of your account credentials and for taking reasonable steps to prevent unauthorized access.</p>
<p>You should notify us promptly if you believe your account has been compromised.</p>
<p>You must not:</p>
<ul>
<li>Impersonate another person.</li>
<li>Provide information you know to be materially false.</li>
<li>Attempt to access another user's account without authorization.</li>
<li>Circumvent authentication or account-security controls.</li>
<li>Use another person's credentials without permission.</li>
</ul>
<p>We may take appropriate action where an account appears to violate these Terms or creates a security risk, subject to applicable law.</p>

<h3>3. Educational Purpose</h3>
<p>Miimiid provides financial education to help users understand money, budgeting, saving, spending, borrowing, investing concepts, and other relevant topics.</p>
<p>Our educational content is intended to support learning and informed decision-making.</p>
<p>Miimiid is not a substitute for individualized professional financial, legal, tax, or investment advice.</p>
<p>Information presented in a lesson or example may not reflect your personal circumstances or the most recent developments in financial markets, products, or regulations.</p>
<p>You are responsible for evaluating your circumstances and considering relevant risks before making financial decisions.</p>
<p>Where a decision has significant consequences, you may wish to consult an appropriately qualified professional.</p>

<h3>4. Miimiid AI Tutor</h3>
<p>Miimiid AI Tutor uses artificial intelligence to help explain concepts, answer questions, and support financial learning.</p>
<p>AI-generated responses may occasionally be incomplete, outdated, misleading, or incorrect.</p>
<p>You should not assume that every response is accurate simply because it sounds confident or authoritative.</p>
<p>The AI Tutor may not understand every detail of your circumstances, and it should not be treated as a guaranteed source of professional advice.</p>
<p>You agree not to use the AI Tutor to facilitate unlawful conduct, fraud, abuse, or activities that violate these Terms.</p>
<p>We may impose reasonable usage limits or other safeguards to maintain service quality, protect users, and prevent abuse.</p>

<h3>5. Learning Content and Intellectual Property</h3>
<p>Unless otherwise stated, the Miimiid platform, its original branding, visual designs, software, original educational materials, and other proprietary content are owned by or licensed to the relevant rights holders.</p>
<p>You may use available learning materials for personal educational purposes in accordance with these Terms.</p>
<p>Unless expressly permitted by law or authorized by the applicable rights holder, you must not:</p>
<ul>
<li>Reproduce or redistribute substantial portions of proprietary content.</li>
<li>Sell or commercially exploit Miimiid content without authorization.</li>
<li>Remove applicable ownership notices.</li>
<li>Copy or modify the application to create an unauthorized competing product.</li>
<li>Use automated methods to extract content in violation of applicable restrictions.</li>
</ul>
<p>Nothing in these Terms removes rights that cannot legally be restricted.</p>

<h3>6. User Conduct</h3>
<p>We want Miimiid to remain a useful, respectful, and safe learning environment.</p>
<p>You agree not to:</p>
<ul>
<li>Use the platform for unlawful purposes.</li>
<li>Attempt to disrupt or damage our systems.</li>
<li>Interfere with another user's experience.</li>
<li>Circumvent technical restrictions or access controls.</li>
<li>Exploit bugs, vulnerabilities, or game mechanics for unauthorized advantages.</li>
<li>Upload malicious code or harmful content.</li>
<li>Misuse the platform to distribute fraudulent material.</li>
<li>Attempt to access restricted content without authorization.</li>
</ul>
<p>We may investigate suspected misuse and take proportionate action where appropriate.</p>

<h3>7. Fun Center and Game Features</h3>
<p>The Fun Center may provide interactive financial-learning games, activities, scores, achievements, experience points, and other progress-related features.</p>
<p>These features are intended to support engagement and learning.</p>
<p>Scores, achievements, and experience points displayed within Miimiid are application features and do not automatically represent money, investments, or redeemable financial value.</p>
<p>Unless a specific feature expressly states otherwise, you should not assume that virtual points or achievements can be exchanged for cash, transferred, or redeemed for real-world goods or services.</p>
<p>We may update, rebalance, suspend, or discontinue game features as the platform develops, subject to applicable law and any specific commitments we have made to users.</p>

<h3>8. Subscriptions and Premium Features</h3>
<p>Miimiid may offer free educational content and separate paid or premium features.</p>
<p>Where paid subscriptions or purchases are introduced, the applicable pricing, billing arrangements, renewal terms, cancellation procedures, and access conditions will be presented through the relevant purchasing process.</p>
<p>You should review those details before completing a purchase.</p>
<p>Access to restricted content may depend on your subscription status or other applicable eligibility requirements.</p>
<p>We may change feature availability or introduce new subscription options, subject to applicable law and any contractual commitments.</p>
<p>Nothing in this section means that a paid subscription is currently available unless the application actually offers it.</p>

<h3>9. Service Availability and Changes</h3>
<p>We aim to provide a reliable and useful learning experience. However, Miimiid may occasionally be unavailable because of maintenance, technical failures, infrastructure issues, security incidents, or circumstances beyond our reasonable control.</p>
<p>We may update or modify features to improve performance, security, accessibility, or educational value.</p>
<p>Where reasonably practicable, we will take appropriate steps to minimize disruption.</p>
<p>We do not guarantee uninterrupted access unless expressly required by applicable law or a specific agreement.</p>

<h3>10. Account Suspension and Termination</h3>
<p>We may restrict or suspend access when reasonably necessary to investigate serious misuse, protect platform security, comply with legal obligations, or enforce these Terms.</p>
<p>Where appropriate and legally permitted, we will provide information about the reason for the restriction and any available review process.</p>
<p>You may stop using Miimiid at any time.</p>
<p>If account deletion is available, you may use the relevant account controls or contact support for assistance. Account deletion may affect learning history and other associated information, subject to applicable retention requirements.</p>

<h3>11. Privacy</h3>
<p>Your use of Miimiid is also subject to our Privacy Policy.</p>
<p>The Privacy Policy explains how personal information is handled, including relevant information associated with accounts, learning activities, and AI Tutor interactions.</p>
<p>Please review that policy to understand the applicable data practices.</p>

<h3>12. Third-Party Services</h3>
<p>Certain Miimiid features may depend on external service providers.</p>
<p>We do not control every aspect of those services and cannot guarantee their independent availability or performance.</p>
<p>Where third-party terms or policies apply directly to your use of a service, you may also need to comply with those terms.</p>
<p>Nothing in this section excludes responsibility that cannot legally be excluded.</p>

<h3>13. Limitation of Liability</h3>
<p>To the extent permitted by applicable law, Miimiid and its operators will not be liable for indirect or consequential losses arising from the use of the platform where such exclusions are legally enforceable.</p>
<p>We do not guarantee that educational information or AI-generated responses will always be complete, accurate, or suitable for every individual circumstance.</p>
<p>Nothing in these Terms excludes or limits liability where such exclusion or limitation is prohibited by law, including any applicable non-waivable consumer rights.</p>

<h3>14. Changes to These Terms</h3>
<p>We may revise these Terms as our services, business practices, or legal obligations evolve.</p>
<p>When material changes are made, we will update the effective date and provide notice where required.</p>
<p>Your continued use of Miimiid after changes take effect will be governed by the revised Terms to the extent permitted by applicable law.</p>
<p>Where fresh consent is legally required, we will seek it through an appropriate process.</p>

<h3>15. Applicable Law and Disputes</h3>
<p>These Terms are subject to applicable law.</p>
<p>Nothing in this section removes mandatory legal protections available to users under applicable law.</p>

<h3>16. Contact Information</h3>
<p>For questions about these Terms, account access, or the use of Miimiid, contact:</p>
<p>Miimiid Financial Academy<br>Use the Support center in the menu to reach us.</p>
<p>We encourage users to contact us when they need clarification about these Terms or how they apply to a particular feature.</p>
<p><em>Miimiid: Smart Choices. Brighter Tomorrows.</em></p>`
};
