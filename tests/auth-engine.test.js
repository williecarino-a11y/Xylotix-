"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const engine = fs.readFileSync(path.join(root, "public", "miimiid-auth-engine-v5.js"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "miimiid-auth-engine.css"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

// v5 architecture
assert.match(engine, /const FLOW\s*=/);
assert.match(engine, /class AuthEngine/);
assert.match(engine, /class FormEngine/);
assert.match(engine, /class ValidationEngine/);
assert.match(engine, /class AuthService/);
assert.match(engine, /class SessionManager/);
assert.match(engine, /class NavigationController/);
assert.match(engine, /class ActionController/);
assert.match(engine, /class Renderer/);

// Central event/state lifecycle
assert.match(engine, /FIELD_CHANGED/);
assert.match(engine, /SUBMITTING/);
assert.match(engine, /SUCCESS/);
assert.match(engine, /FAILURE/);
assert.match(engine, /requestAnimationFrame/);
assert.match(engine, /this\.actions\.execute/);

// Required auth endpoints
for (const endpoint of [
  "/api/auth/register",
  "/api/auth/login",
  "/api/auth/verify-account",
  "/api/auth/resend-verification",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/me",
  "/api/auth/logout"
]) {
  assert.match(engine, new RegExp(endpoint.replaceAll("/", "\\/")));
}

// Registration contract: six stages, email-only, male/female gender,
// DOB before password, and password confirmation on its own step.
assert.match(engine, /REGISTER_STEPS=\['welcome','name','email','personal','password','verification'\]/);
assert.match(engine, /v==='male'\|\|v==='female'/);
assert.match(engine, /dateOfBirth.*gender/);
assert.match(engine, /confirmPassword/);
assert.match(engine, /register\(v\).*gender.*dateOfBirth.*password/);

// Shared partial-arc loading state.
assert.match(engine, /miimiid-auth-v5-spinner/);
assert.match(engine, /border-right-color:transparent/);
assert.match(engine, /miimiid-auth-v5-spin/);

// Server must activate v5 and must not activate an older engine.
assert.match(server, /miimiid-auth-engine-v5\.js/);
assert.doesNotMatch(server, /miimiid-auth-engine-v4\.js/);

console.log("Miimiid Auth Engine v5 architecture smoke tests passed.");
