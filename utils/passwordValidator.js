const MIN_PASSWORD_LENGTH = 8;

function validatePassword(password) {
  const value = typeof password === 'string' ? password : '';
  const errors = [];

  if (!value) {
    errors.push({ code: 'PASSWORD_REQUIRED', message: 'Enter a password.' });
  } else if (value.length < MIN_PASSWORD_LENGTH) {
    errors.push({
      code: 'PASSWORD_TOO_SHORT',
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
    });
  }

  return {
    valid: errors.length === 0,
    minLength: MIN_PASSWORD_LENGTH,
    length: value.length,
    errors
  };
}

module.exports = {
  MIN_PASSWORD_LENGTH,
  validatePassword
};
