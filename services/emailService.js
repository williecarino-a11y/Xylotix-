const nodemailer = require('nodemailer');

function getEmailConfig() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const port = Number(process.env.SMTP_PORT || 465);

  if (!host || !user || !password) return null;

  return {
    host,
    port,
    secure: port === 465,
    auth: { user, pass: password },
    from: process.env.SMTP_FROM || process.env.SMTP_USER
  };
}

function isEmailConfigured() {
  return Boolean(getEmailConfig());
}

function createMailer() {
  const config = getEmailConfig();
  return config ? nodemailer.createTransport(config) : null;
}

async function sendVerificationEmail({ to, code, expiresInMinutes = 5 }) {
  const config = getEmailConfig();
  if (!config) {
    const error = new Error('Verification email service is not configured.');
    error.code = 'EMAIL_SERVICE_NOT_CONFIGURED';
    throw error;
  }

  const mailer = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.auth,
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });

  return mailer.sendMail({
    from: config.from,
    to,
    subject: 'Your Miimiid verification code',
    text: `Your Miimiid verification code is ${code}.\n\nThis code expires in ${expiresInMinutes} minutes.\n\nIf you did not create a Miimiid account, you can ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Welcome to Miimiid</h2><p>Your account verification code is:</p><p style="font-size:32px;font-weight:700;letter-spacing:8px">${code}</p><p>This code expires in ${expiresInMinutes} minutes.</p><p>If you did not create a Miimiid account, you can ignore this email.</p></div>`
  });
}

module.exports = {
  getEmailConfig,
  isEmailConfigured,
  createMailer,
  sendVerificationEmail
};
