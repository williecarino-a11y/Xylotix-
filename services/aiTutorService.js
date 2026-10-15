const OpenAI = require("openai");
const {
  AI_TUTOR_PERSONALITY,
  AI_TUTOR_APP_RULES
} = require("./aiTutorPersonality");

const DEFAULT_MODEL =
  process.env.OPENAI_AI_TUTOR_MODEL ||
  "gpt-5.6";

const MAX_MESSAGE_LENGTH = 4000;
const MAX_HISTORY_MESSAGES = 12;
const MAX_HISTORY_TOTAL_LENGTH = 12000;
const MAX_CONTEXT_FIELD_LENGTH = 200;
const SUPPORTED_LANGUAGES = new Set([
  "en",
  "yo",
  "ig",
  "ha"
]);

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

    const normalized = history
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

    let totalLength = 0;
    const bounded = [];

    for (let index = normalized.length - 1; index >= 0; index -= 1) {
      const message = normalized[index];
      if (totalLength + message.content.length > MAX_HISTORY_TOTAL_LENGTH) {
        break;
      }
      bounded.unshift(message);
      totalLength += message.content.length;
    }

    return bounded;
  }

  normalizeContextField(value) {
    return typeof value === "string"
      ? value.trim().slice(0, MAX_CONTEXT_FIELD_LENGTH)
      : "";
  }

  normalizeLanguage(language) {
    const normalized =
      typeof language === "string"
        ? language.trim().toLowerCase()
        : "en";

    return SUPPORTED_LANGUAGES.has(normalized)
      ? normalized
      : "en";
  }

  buildInstructions({
    language = "en",
    courseTitle = "",
    moduleTitle = "",
    lessonTitle = ""
  } = {}) {
    const safeLanguage = this.normalizeLanguage(language);
    const safeCourseTitle = this.normalizeContextField(courseTitle);
    const safeModuleTitle = this.normalizeContextField(moduleTitle);
    const safeLessonTitle = this.normalizeContextField(lessonTitle);

    const context = [
      safeCourseTitle
        ? `Course: ${safeCourseTitle}`
        : "",
      safeModuleTitle
        ? `Module: ${safeModuleTitle}`
        : "",
      safeLessonTitle
        ? `Lesson: ${safeLessonTitle}`
        : ""
    ]
      .filter(Boolean)
      .join("\n");

    return `
${AI_TUTOR_PERSONALITY}

${AI_TUTOR_APP_RULES}

LANGUAGE:
Respond in the learner's selected language: ${safeLanguage}.

CURRENT LEARNING CONTEXT:
${context || "No specific lesson context is currently available."}
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
