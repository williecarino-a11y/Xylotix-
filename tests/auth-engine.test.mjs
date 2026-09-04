import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';

import { AUTH_FLOW } from '../public/auth-engine/config.js';
import { AUTH_STATUS, createAuthState, AuthStore } from '../public/auth-engine/state.js';
import { FormEngine } from '../public/auth-engine/form.js';
import { ValidationEngine } from '../public/auth-engine/validation.js';

const root = path.join(process.cwd());
const authEngine = fs.readFileSync(path.join(root, 'public', 'miimiid-auth-engine.js'), 'utf8');
const loader = fs.readFileSync(path.join(root, 'public', 'continue-loading.js'), 'utf8');
const server = fs.readFileSync(path.join(root, 'server.js'), 'utf8');
const authRoutes = fs.readFileSync(path.join(root, 'routes', 'authRoutes.js'), 'utf8');
const passwordRoutes = fs.readFileSync(path.join(root, 'routes', 'passwordRoutes.js'), 'utf8');
const passwordValidator = fs.readFileSync(path.join(root, 'utils', 'passwordValidator.js'), 'utf8');
const userModel = fs.readFileSync(path.join(root, 'models', 'User.js'), 'utf8');
const sessionModel = fs.readFileSync(path.join(root, 'models', 'UserSession.js'), 'utf8');
const resetModel = fs.readFileSync(path.join(root, 'models', 'PasswordResetToken.js'), 'utf8');
const authCss = fs.readFileSync(path.join(root, 'public', 'miimiid-auth-engine.css'), 'utf8');

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

  const valid = validation.validateStep(step, { gender: 'female', dateOfBirth: '1990-01-01' });
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

test('current browser auth architecture uses one central auth engine', () => {
  assert.match(authEngine, /window\.MIIMIID_AUTH_ENGINE/);
  assert.match(authEngine, /SESSION_STATES/);
  assert.match(authEngine, /activeOperation/);
  assert.match(authEngine, /X-Continue-Loading/);
  assert.match(server, /miimiid-auth-engine\.js/);
  assert.doesNotMatch(server, /auth-shell-fix\.js/);
});

test('shared ContinueLoading owns the C-shaped registration loader', () => {
  assert.match(loader, /continue-loading-arc/);
  assert.match(loader, /border-right-color:\s*transparent/);
  assert.match(loader, /window\.ContinueLoading/);
  assert.match(authCss, /continue-loading-arc/);
  assert.doesNotMatch(authCss, /miimiid-engine-spinner/);
});

test('security lifecycle protections are present', () => {
  assert.match(authRoutes, /Cache-Control.*no-store/);
  assert.match(authRoutes, /expiresAt:\s*\{ \$gt:/);
  assert.match(authRoutes, /clearSessionCookie\(res\)/);
  assert.match(authRoutes, /error\.code === 11000/);
  assert.match(authRoutes, /ACCOUNT_EXISTS/);
  assert.match(authRoutes, /usedAt: null/);
  assert.match(authRoutes, /findOneAndUpdate\(/);
  assert.match(authRoutes, /UserSession\.deleteMany\(\{ userId: reset\.userId \}\)/);
  assert.match(authRoutes, /PASSWORD_RESET_RATE_LIMITED/);
  assert.match(passwordRoutes, /validatePassword/);
  assert.match(userModel, /unique:\s*true/);
  assert.match(sessionModel, /expireAfterSeconds:\s*0/);
  assert.match(resetModel, /usedAt/);
  assert.match(resetModel, /expireAfterSeconds:\s*0/);
});

test('health endpoints distinguish liveness from readiness', () => {
  assert.match(server, /\/api\/health\/live/);
  assert.match(server, /\/api\/health\/ready/);
  assert.match(server, /Miimiid is alive/);
  assert.match(server, /Miimiid is ready to serve traffic/);
  assert.match(server, /status\(ready \? 200 : 503\)/);
});

test('password validation remains centralized', () => {
  assert.match(passwordValidator, /function validatePassword/);
  assert.match(authRoutes, /const passwordResult = validatePassword\(password\)/);
  assert.match(passwordRoutes, /const result = validatePassword\(password\)/);
});
