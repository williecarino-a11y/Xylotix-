const express = require("express");

const router = express.Router();

const aiTutorService =
  require("../services/aiTutorService");

/*
 * MIIMIID AI TUTOR
 *
 * This route keeps the OpenAI API key entirely on
 * the server. The browser never receives the key.
 *
 * Frontend:
 * POST /api/ai-tutor/chat
 */

router.post(
  "/chat",
  async (req, res) => {
    try {
      const {
        message,
        history = [],
        language = "en",
        courseTitle = "",
        moduleTitle = "",
        lessonTitle = ""
      } = req.body || {};

      const result =
        await aiTutorService.chat({
          message,
          history,
          language,
          courseTitle,
          moduleTitle,
          lessonTitle
        });

      return res.json({
        success: true,
        answer: result.answer
      });

    } catch (error) {
      console.error(
        "Miimiid AI Tutor request failed:",
        error
      );

      if (
        error.code ===
        "AI_TUTOR_NOT_CONFIGURED"
      ) {
        return res.status(503).json({
          success: false,
          code:
            "AI_TUTOR_NOT_CONFIGURED",
          message:
            "Miimiid AI Tutor is not configured yet."
        });
      }

      if (
        error.code ===
        "AI_TUTOR_INVALID_MESSAGE"
      ) {
        return res.status(400).json({
          success: false,
          code:
            "AI_TUTOR_INVALID_MESSAGE",
          message:
            "A tutor message is required."
        });
      }

      if (
        error.code ===
        "AI_TUTOR_EMPTY_RESPONSE"
      ) {
        return res.status(502).json({
          success: false,
          code:
            "AI_TUTOR_EMPTY_RESPONSE",
          message:
            "The AI Tutor did not return a response."
        });
      }

      return res.status(500).json({
        success: false,
        code:
          "AI_TUTOR_REQUEST_FAILED",
        message:
          "Unable to reach Miimiid AI Tutor."
      });
    }
  }
);

module.exports = router;
