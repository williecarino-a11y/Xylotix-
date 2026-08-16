const express = require('express');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const User = require('../models/User');
const UserSession = require('../models/UserSession');
const PasswordResetToken =
  require('../models/PasswordResetToken');

const router = express.Router();

const SESSION_DAYS = 30;
const RESET_MINUTES = 30;

const COOKIE_NAME =
  process.env.AUTH_COOKIE_NAME ||
  'miimiid_session';

function normalizeEmail(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function normalizePhone(value) {
  return String(value || '')
    .trim()
    .replace(/[^\d+]/g, '');
}

function hashToken(token) {
  return crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');
}

function createToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashPassword(password) {
  return new Promise((resolve, reject) => {
    const salt =
      crypto.randomBytes(16).toString('hex');

    crypto.scrypt(
      password,
      salt,
      64,
      {
        N: 16384,
        r: 8,
        p: 1
      },
      (error, derivedKey) => {
        if (error) {
          return reject(error);
        }

        resolve(
          `scrypt:${salt}:${derivedKey.toString('hex')}`
        );
      }
    );
  });
}

function verifyPassword(password, storedHash) {
  return new Promise((resolve, reject) => {
    const parts = String(storedHash).split(':');

    if (
      parts.length !== 3 ||
      parts[0] !== 'scrypt'
    ) {
      return resolve(false);
    }

    const salt = parts[1];
    const expected =
      Buffer.from(parts[2], 'hex');

    crypto.scrypt(
      password,
      salt,
      expected.length,
      {
        N: 16384,
        r: 8,
        p: 1
      },
      (error, derivedKey) => {
        if (error) {
          return reject(error);
        }

        if (
          derivedKey.length !== expected.length
        ) {
          return resolve(false);
        }

        resolve(
          crypto.timingSafeEqual(
            derivedKey,
            expected
          )
        );
      }
    );
  });
}

function setSessionCookie(res, token) {
  const secure =
    process.env.NODE_ENV === 'production';

  res.cookie(
    COOKIE_NAME,
    token,
    {
      httpOnly: true,
      secure,
      sameSite: 'lax',
      maxAge:
        SESSION_DAYS *
        24 *
        60 *
        60 *
        1000,
      path: '/'
    }
  );
}

function clearSessionCookie(res) {
  res.clearCookie(
    COOKIE_NAME,
    {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    }
  );
}

async function createSession(userId) {
  const token = createToken();

  const expiresAt =
    new Date(
      Date.now() +
      SESSION_DAYS *
      24 *
      60 *
      60 *
      1000
    );

  await UserSession.create({
    userId,
    tokenHash: hashToken(token),
    expiresAt
  });

  return token;
}

async function getAuthenticatedUser(req) {
  const token =
    req.cookies &&
    req.cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  const session =
    await UserSession.findOne({
      tokenHash: hashToken(token),
      expiresAt: {
        $gt: new Date()
      }
    }).populate('userId');

  return session
    ? session.userId
    : null;
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    phone: user.phone
  };
}

function getMailer() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASSWORD
  ) {
    return null;
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure:
      String(process.env.SMTP_SECURE) === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}


/**
 * POST /api/auth/register
 */
router.post(
  '/register',
  async (req, res) => {
    try {
      const {
        name,
        email,
        phone,
        password
      } = req.body;

      if (
        typeof name !== 'string' ||
        name.trim().length < 2
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'A valid name is required.'
        });
      }

      const normalizedEmail =
        normalizeEmail(email);

      const normalizedPhone =
        normalizePhone(phone);

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizedEmail
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Enter a valid email address.'
        });
      }

      if (
        normalizedPhone.length < 7
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Enter a valid phone number.'
        });
      }

      if (
        typeof password !== 'string' ||
        password.length < 8
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Password must be at least 8 characters.'
        });
      }

      const existing =
        await User.findOne({
          $or: [
            {
              email: normalizedEmail
            },
            {
              phone: normalizedPhone
            }
          ]
        });

      if (existing) {
        return res.status(409).json({
          status: 'error',
          message:
            'An account with those details already exists.'
        });
      }

      const passwordHash =
        await hashPassword(password);

      const user =
        await User.create({
          name: name.trim(),
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash
        });

      const token =
        await createSession(user._id);

      setSessionCookie(res, token);

      return res.status(201).json({
        status: 'success',
        data: {
          user: publicUser(user)
        }
      });
    } catch (error) {
      console.error(
        'Registration error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to create your account.'
      });
    }
  }
);


/**
 * POST /api/auth/login
 *
 * Login with email OR phone number.
 */
router.post(
  '/login',
  async (req, res) => {
    try {
      const identifier =
        String(
          req.body.identifier || ''
        ).trim();

      const password =
        String(
          req.body.password || ''
        );

      if (!identifier || !password) {
        return res.status(400).json({
          status: 'error',
          message:
            'Email or phone number and password are required.'
        });
      }

      const normalizedEmail =
        normalizeEmail(identifier);

      const normalizedPhone =
        normalizePhone(identifier);

      const user =
        await User.findOne({
          $or: [
            {
              email: normalizedEmail
            },
            {
              phone: normalizedPhone
            }
          ]
        });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message:
            'Invalid login details.'
        });
      }

      const valid =
        await verifyPassword(
          password,
          user.passwordHash
        );

      if (!valid) {
        return res.status(401).json({
          status: 'error',
          message:
            'Invalid login details.'
        });
      }

      const token =
        await createSession(user._id);

      setSessionCookie(res, token);

      return res.status(200).json({
        status: 'success',
        data: {
          user: publicUser(user)
        }
      });
    } catch (error) {
      console.error(
        'Login error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to log in.'
      });
    }
  }
);


/**
 * GET /api/auth/me
 */
router.get(
  '/me',
  async (req, res) => {
    try {
      const user =
        await getAuthenticatedUser(req);

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Not authenticated.'
        });
      }

      return res.status(200).json({
        status: 'success',
        data: {
          user: publicUser(user)
        }
      });
    } catch (error) {
      console.error(
        'Authentication lookup error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to determine authentication state.'
      });
    }
  }
);


/**
 * POST /api/auth/logout
 */
router.post(
  '/logout',
  async (req, res) => {
    try {
      const token =
        req.cookies &&
        req.cookies[COOKIE_NAME];

      if (token) {
        await UserSession.deleteOne({
          tokenHash: hashToken(token)
        });
      }

      clearSessionCookie(res);

      return res.status(200).json({
        status: 'success'
      });
    } catch (error) {
      console.error(
        'Logout error:',
        error
      );

      clearSessionCookie(res);

      return res.status(200).json({
        status: 'success'
      });
    }
  }
);


/**
 * POST /api/auth/forgot-password
 *
 * Password recovery is email-based.
 */
router.post(
  '/forgot-password',
  async (req, res) => {
    try {
      const email =
        normalizeEmail(req.body.email);

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          email
        )
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Enter a valid email address.'
        });
      }

      const user =
        await User.findOne({
          email
        });

      /*
       * Do not reveal whether the account exists.
       */
      if (!user) {
        return res.status(200).json({
          status: 'success',
          message:
            'If an account exists for that email, password recovery instructions will be sent.'
        });
      }

      const mailer =
        getMailer();

      if (!mailer) {
        console.error(
          'Password recovery requested but SMTP is not configured.'
        );

        return res.status(503).json({
          status: 'error',
          message:
            'Password recovery email service is not configured yet.'
        });
      }

      await PasswordResetToken.deleteMany({
        userId: user._id
      });

      const token =
        createToken();

      await PasswordResetToken.create({
        userId: user._id,
        tokenHash: hashToken(token),
        expiresAt:
          new Date(
            Date.now() +
            RESET_MINUTES *
            60 *
            1000
          )
      });

      const baseUrl =
        process.env.APP_BASE_URL ||
        'http://localhost:3000';

      const resetUrl =
        `${baseUrl}/?resetToken=${encodeURIComponent(token)}`;

      await mailer.sendMail({
        from:
          process.env.SMTP_FROM ||
          process.env.SMTP_USER,
        to: user.email,
        subject:
          'Reset your Miimiid password',
        text:
          `Reset your Miimiid password using this link:\n\n${resetUrl}\n\nThis link expires in ${RESET_MINUTES} minutes.`,
        html:
          `<p>You requested a Miimiid password reset.</p>
           <p><a href="${resetUrl}">Reset your password</a></p>
           <p>This link expires in ${RESET_MINUTES} minutes.</p>
           <p>If you did not request this, you can safely ignore this email.</p>`
      });

      return res.status(200).json({
        status: 'success',
        message:
          'If an account exists for that email, password recovery instructions will be sent.'
      });
    } catch (error) {
      console.error(
        'Forgot password error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to process password recovery.'
      });
    }
  }
);


/**
 * POST /api/auth/reset-password
 */
router.post(
  '/reset-password',
  async (req, res) => {
    try {
      const {
        token,
        password
      } = req.body;

      if (
        typeof token !== 'string' ||
        !token
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Password reset token is required.'
        });
      }

      if (
        typeof password !== 'string' ||
        password.length < 8
      ) {
        return res.status(400).json({
          status: 'error',
          message:
            'Password must be at least 8 characters.'
        });
      }

      const reset =
        await PasswordResetToken.findOne({
          tokenHash: hashToken(token),
          expiresAt: {
            $gt: new Date()
          },
          usedAt: null
        });

      if (!reset) {
        return res.status(400).json({
          status: 'error',
          message:
            'This password reset link is invalid or has expired.'
        });
      }

      const passwordHash =
        await hashPassword(password);

      await User.findByIdAndUpdate(
        reset.userId,
        {
          passwordHash
        }
      );

      reset.usedAt =
        new Date();

      await reset.save();

      await UserSession.deleteMany({
        userId: reset.userId
      });

      return res.status(200).json({
        status: 'success',
        message:
          'Your password has been reset successfully.'
      });
    } catch (error) {
      console.error(
        'Reset password error:',
        error
      );

      return res.status(500).json({
        status: 'error',
        message:
          'Unable to reset your password.'
      });
    }
  }
);


module.exports = {
  router,
  getAuthenticatedUser
};
