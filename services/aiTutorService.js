const OpenAI = require("openai");

const DEFAULT_MODEL =
  process.env.OPENAI_AI_TUTOR_MODEL ||
  "gpt-5.6";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 12;

class AITutorService {
  constructor() {
    this.model = DEFAULT_MODEL;
    this.openai = null;

    this.initializeOpenAI();
  }

  initializeOpenAI() {
    const apiKey =
      process.env.OPENAI_API_KEY;

    if (!apiKey) {
      console.warn(
        "Miimiid AI Tutor disabled: OPENAI_API_KEY is not configured."
      );
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey
      });

      console.log(
        `Miimiid AI Tutor ready (${this.model}).`
      );
    } catch (error) {
      this.openai = null;

      console.error(
        "Miimiid AI Tutor could not initialize:",
        error.message
      );
    }
  }

  isConfigured() {
    return Boolean(this.openai);
  }

  normalizeHistory(history) {
    if (!Array.isArray(history)) {
      return [];
    }

    return history
      .slice(-MAX_HISTORY_MESSAGES)
      .filter(
        message =>
          message &&
          typeof message === "object" &&
          ["user", "assistant"].includes(message.role) &&
          typeof message.content === "string"
      )
      .map(message => ({
        role: message.role,
        content: message.content
          .trim()
          .slice(0, MAX_MESSAGE_LENGTH)
      }))
      .filter(message => message.content);
  }

  buildInstructions({
    language = "en",
    courseTitle = "",
    moduleTitle = "",
    lessonTitle = ""
  } = {}) {
    const context = [
      courseTitle
        ? `Course: ${courseTitle}`
        : "",
      moduleTitle
        ? `Module: ${moduleTitle}`
        : "",
      lessonTitle
        ? `Lesson: ${lessonTitle}`
        : ""
    ]
      .filter(Boolean)
      .join("\n");

    return `
You are Miimiid AI Tutor, the personal financial-learning tutor inside the Miimiid app.

Your job is to help learners genuinely understand money and personal finance through practical, clear, relatable explanations.

CORE BEHAVIOR:
- Be helpful, encouraging, concise, and practical.
- Explain ideas in everyday language.
- Avoid unnecessary economics or academic jargon.
- Use realistic examples when they improve understanding.
- Break complicated financial ideas into simple steps.
- Use simple calculations when useful.
- Ask a short follow-up question when it would meaningfully help the learner.
- Never pretend to know personal financial facts that the learner has not provided.
- Do not guarantee investment returns or financial outcomes.
- Do not present personalized financial advice as certainty.
- Encourage learners to consider risk, goals, affordability, and their own circumstances.
- Do not simply give answers to active quizzes when doing so would undermine learning. Instead, guide the learner toward the answer.
- If the learner asks about something outside financial learning, answer briefly when appropriate and guide the conversation back toward useful learning.

LANGUAGE:
Respond in the learner's selected language: ${language}.

CURRENT LEARNING CONTEXT:
${context || "No specific lesson context is currently available."}

IDENTITY:
Your name is Miimiid AI Tutor.
Do not claim to be ChatGPT or another branded tutor.
`.trim();
  }

  buildInput(message, history) {
    const previousMessages =
      this.normalizeHistory(history);

    return [
      ...previousMessages,
      {
        role: "user",
        content: message.trim().slice(
          0,
          MAX_MESSAGE_LENGTH
        )
      }
    ];
  }

  async chat({
    message,
    history = [],
    language = "en",
    courseTitle = "",
    moduleTitle = "",
    lessonTitle = ""
  }) {
    if (!this.openai) {
      const error =
        new Error(
          "AI Tutor is not configured."
        );

      error.code =
        "AI_TUTOR_NOT_CONFIGURED";

      throw error;
    }

    if (
      typeof message !== "string" ||
      !message.trim()
    ) {
      const error =
        new Error(
          "A tutor message is required."
        );

      error.code =
        "AI_TUTOR_INVALID_MESSAGE";

      throw error;
    }

    const response =
      await this.openai.responses.create({
        model: this.model,

        instructions:
          this.buildInstructions({
            language,
            courseTitle,
            moduleTitle,
            lessonTitle
          }),

        input:
          this.buildInput(
            message,
            history
          )
      });

    const answer =
      typeof response.output_text === "string"
        ? response.output_text.trim()
        : "";

    if (!answer) {
      const error =
        new Error(
          "Miimiid AI Tutor returned an empty response."
        );

      error.code =
        "AI_TUTOR_EMPTY_RESPONSE";

      throw error;
    }

    return {
      answer,
      model: this.model
    };
  }
}

module.exports =
  new AITutorService();

module.exports.AITutorService =
  AITutorService;
