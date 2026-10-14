const nodemailer = require('nodemailer');

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';
const TIMEOUT_MS = 10000;

async function sendViaBrevo({ to, subject, text, html }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(BREVO_URL, {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': process.env.BREVO_API_KEY
      },
      body: JSON.stringify({
        sender: { name: process.env.MAIL_FROM_NAME || 'Miimiid', email: process.env.MAIL_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        textContent: text,
        htmlContent: html
      }),
      signal: controller.signal
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => '');
      throw new Error(`Email provider error ${response.status}: ${detail.slice(0, 300)}`);
    }
  } finally {
    clearTimeout(timer);
  }
}

function getSmtpMailer() {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const password = process.env.SMTP_PASSWORD;
  const configuredPort = Number(process.env.SMTP_PORT || 465);
  if (!host || !user || !password) return null;
  return nodemailer.createTransport({
    host,
    port: configuredPort,
    secure: configuredPort === 465,
    auth: { user, pass: password },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
    socketTimeout: 30000
  });
}

function getMailer() {
  if (process.env.BREVO_API_KEY && process.env.MAIL_FROM_EMAIL) {
    return { sendMail: sendViaBrevo };
  }
  return getSmtpMailer();
}

module.exports = { getMailer };
