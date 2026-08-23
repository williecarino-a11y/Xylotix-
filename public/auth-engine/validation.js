const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const VALIDATION_CODES = Object.freeze({
  REQUIRED: 'authRequired',
  EMAIL: 'authEnterValidEmail',
  PASSWORD: 'authPasswordMinLength',
  CONFIRMATION: 'authPasswordMismatch',
  BIRTHDAY: 'authBirthdayInvalid',
  GENDER: 'authGenderRequired',
  VERIFICATION: 'authVerificationCodeRequired'
});

export class ValidationEngine {
  rule(rule, value, values) {
    const v = String(value ?? '');
    switch (rule) {
      case 'required': return v.trim() ? null : VALIDATION_CODES.REQUIRED;
      case 'email': return EMAIL.test(v.trim().toLowerCase()) ? null : VALIDATION_CODES.EMAIL;
      case 'password': return v.length >= 8 ? null : VALIDATION_CODES.PASSWORD;
      case 'confirmation': return v === String(values.password ?? '') ? null : VALIDATION_CODES.CONFIRMATION;
      case 'gender': return ['male', 'female'].includes(v) ? null : VALIDATION_CODES.GENDER;
      case 'verification': return /^\d{6}$/.test(v.trim()) ? null : VALIDATION_CODES.VERIFICATION;
      case 'birthday': return this.birthday(v) ? null : VALIDATION_CODES.BIRTHDAY;
      default: return null;
    }
  }

  birthday(value) {
    if (!DATE.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
    const now = new Date();
    let age = now.getUTCFullYear() - date.getUTCFullYear();
    const beforeBirthday = now.getUTCMonth() < date.getUTCMonth() ||
      (now.getUTCMonth() === date.getUTCMonth() && now.getUTCDate() < date.getUTCDate());
    if (beforeBirthday) age -= 1;
    return date.getTime() <= now.getTime() && age >= 18;
  }

  validateField(field, values) {
    for (const rule of field.rules || []) {
      const code = this.rule(rule, values[field.id], values);
      if (code) return { code, field: field.id };
    }
    return null;
  }

  validateStep(step, values) {
    const errors = {};
    for (const field of step?.fields || []) {
      const error = this.validateField(field, values);
      if (error) errors[field.id] = error;
    }
    return errors;
  }
}
