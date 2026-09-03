const express = require("express");
const rateLimit = require("express-rate-limit");

const { getAuthenticatedUser } = require("./authRoutes");

const router = express.Router();
const aiTutorService = require("../services/aiTutorService");

const aiTutorLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: "AI_TUTOR_RATE_LIMITED",
    message: "You're sending messages too quickly. Please slow down."
  }
});

async function requireAuth(req, res, next) {
  try {
    const user = await getAuthenticatedUser(req, res);
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "AI_TUTOR_AUTH_REQUIRED",
        message: "Please log in to use the AI Tutor."
      });
    }
    req.authUser = user;
    return next();
  } catch (error) {
    console.error("AI Tutor auth check error:", error);
    return res.status(500).json({
      success: false,
      code: "AI_TUTOR_AUTH_CHECK_FAILED",
      message: "Unable to verify authentication."
    });
  }
}

router.post(
  "/chat",
  requireAuth,
  aiTutorLimiter,
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

      const result = await aiTutorService.chat({
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
      console.error("Miimiid AI Tutor request failed:", error);

      if (error.code === "AI_TUTOR_NOT_CONFIGURED") {
        return res.status(503).json({
          success: false,
          code: "AI_TUTOR_NOT_CONFIGURED",
          message: "Miimiid AI Tutor is not configured yet."
        });
      }

      if (error.code === "AI_TUTOR_INVALID_MESSAGE") {
        return res.status(400).json({
          success: false,
          code: "AI_TUTOR_INVALID_MESSAGE",
          message: "A tutor message is required."
        });
      }

      if (error.code === "AI_TUTOR_EMPTY_RESPONSE") {
        return res.status(502).json({
          success: false,
          code: "AI_TUTOR_EMPTY_RESPONSE",
          message: "The AI Tutor did not return a response."
        });
      }

      return res.status(500).json({
        success: false,
        code: "AI_TUTOR_REQUEST_FAILED",
        message: "Unable to reach Miimiid AI Tutor."
      });
    }
  }
);

module.exports = router;
