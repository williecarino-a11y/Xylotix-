import assert from 'node:assert/strict';
import test from 'node:test';

import { AUTH_FLOW } from '../public/auth-engine/config.js';
import { AUTH_STATUS, createAuthState, AuthStore } from '../public/auth-engine/state.js';
import { FormEngine } from '../public/auth-engine/form.js';
import { ValidationEngine } from '../public/auth-engine/validation.js';

const validation = new ValidationEngine();

test('configuration contains the complete registration flow', () => {
  assert.deepEqual(
    Object.keys(AUTH_FLOW.register.steps),
    ['welcome', 'name', 'email', 'birthday', 'password', 'verification', 'authenticated']
  );
});

test('empty birthday is required and does not become an internal backend error', () => {
  const step = AUTH_FLOW.register.steps.birthday;
  const errors = validation.validateStep(step, { gender: 'male', dateOfBirth: '' });
  assert.equal(errors.dateOfBirth.code, 'authRequired');
});

test('invalid birthday is rejected while a valid adult birthday passes', () => {
  const step = AUTH_FLOW.register.steps.birthday;
  const invalid = validation.validateStep(step, { gender: 'female', dateOfBirth: '2026-99-99' });
  assert.equal(invalid.dateOfBirth.code, 'authBirthdayInvalid');

  const validDate = '1990-01-01';
  const valid = validation.validateStep(step, { gender: 'female', dateOfBirth: validDate });
  assert.equal(valid.dateOfBirth, undefined);
});

test('confirmation validation follows the source password', () => {
  const step = AUTH_FLOW.register.steps.password;
  const errors = validation.validateStep(step, { password: 'correct123', confirmPassword: 'different123' });
  assert.equal(errors.confirmPassword.code, 'authPasswordMismatch');

  const valid = validation.validateStep(step, { password: 'correct123', confirmPassword: 'correct123' });
  assert.equal(valid.confirmPassword, undefined);
});

test('verification code requires exactly six digits', () => {
  const step = AUTH_FLOW.register.steps.verification;
  assert.equal(validation.validateStep(step, { code: '123' }).code.code, 'authVerificationCodeRequired');
  assert.deepEqual(validation.validateStep(step, { code: '123456' }), {});
});

test('form engine tracks dirty, touched and field state', () => {
  const form = new FormEngine();
  form.configure([{ id: 'email', type: 'email', required: true }]);
  assert.equal(form.fields.email.state, 'untouched');

  form.setValue('email', 'user@example.com');
  assert.equal(form.touched.email, true);
  assert.equal(form.dirty.email, true);
  assert.equal(form.fields.email.state, 'filled');

  form.setFocused('email', true);
  assert.equal(form.fields.email.state, 'focused');
});

test('auth store exposes explicit request lifecycle states', () => {
  const store = new AuthStore(createAuthState('login', 'login'));
  assert.equal(store.getState().status, AUTH_STATUS.IDLE);
  store.transition(AUTH_STATUS.VALIDATING);
  assert.equal(store.getState().status, AUTH_STATUS.VALIDATING);
  store.transition(AUTH_STATUS.SUBMITTING, { request: { status: 'loading', action: 'login' } });
  assert.equal(store.getState().request.status, 'loading');
  store.transition(AUTH_STATUS.SUCCESS, { request: { status: 'success', action: 'login' } });
  assert.equal(store.getState().status, AUTH_STATUS.SUCCESS);
});
