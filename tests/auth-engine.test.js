"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const engine = fs.readFileSync(path.join(root, "public", "miimiid-auth-engine-v2.js"), "utf8");
const css = fs.readFileSync(path.join(root, "public", "miimiid-auth-engine.css"), "utf8");
const server = fs.readFileSync(path.join(root, "server.js"), "utf8");

assert.match(engine, /const FLOW = Object\.freeze/);
assert.match(engine, /class AuthController/);
assert.match(engine, /class FormEngine/);
assert.match(engine, /class ValidationEngine/);
assert.match(engine, /class AuthService/);
assert.match(engine, /class SessionManager/);
assert.match(engine, /class NavigationController/);
assert.match(engine, /class PrimaryAction/);
assert.match(engine, /FIELD_CHANGED/);
assert.match(engine, /CONTINUE_PRESSED/);
assert.match(engine, /SUBMIT_STARTED/);
assert.match(engine, /SUBMIT_SUCCEEDED/);
assert.match(engine, /SUBMIT_FAILED/);
assert.match(engine, /RESEND_VERIFICATION/);
assert.match(engine, /SESSION_EXPIRED/);
assert.match(engine, /duplicate|running/);
assert.match(engine, /\/api\/auth\/register/);
assert.match(engine, /\/api\/auth\/login/);
assert.match(engine, /\/api\/auth\/verify-account/);
assert.match(engine, /\/api\/auth\/resend-verification/);
assert.match(engine, /\/api\/auth\/forgot-password/);
assert.match(engine, /\/api\/auth\/reset-password/);
assert.match(engine, /\/api\/auth\/me/);
assert.match(engine, /\/api\/auth\/logout/);
assert.match(css, /miimiid-auth-spin/);
assert.match(css, /data-auth-action-state="submitting"/);
assert.match(server, /miimiid-auth-engine-v2\.js/);

console.log("Miimiid auth engine architecture smoke tests passed.");
