const express = require('express');
const rateLimit = require('express-rate-limit');

const { validatePassword } = require('../utils/passwordValidator');

const router = express.Router();

const passwordValidationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => res.status(429).json({
    status: 'error',
    code: 'PASSWORD_VALIDATION_RATE_LIMITED',
    message: 'Too many password validation requests. Please wait a few minutes and try again.'
  })
});

router.post('/validate', passwordValidationLimiter, (req, res) => {
  const password = typeof req.body?.password === 'string' ? req.body.password : '';
  const result = validatePassword(password);

  if (!result.valid) {
    return res.status(400).json({
      status: 'error',
      code: result.errors[0].code,
      message: result.errors[0].message,
      data: {
        valid: false,
        minLength: result.minLength,
        length: result.length
      }
    });
  }

  return res.status(200).json({
    status: 'success',
    data: {
      valid: true,
      minLength: result.minLength,
      length: result.length
    }
  });
});

module.exports = router;
