const { validatePassword } = require('../utils/passwordValidator');

function passwordValidation(req, res, next) {
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

  return next();
}

module.exports = passwordValidation;
