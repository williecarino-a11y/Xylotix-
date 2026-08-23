const field = (id, type, domId, rules = [], extra = {}) => ({ id, type, domId, rules, ...extra });
const action = (id, label, domId, extra = {}) => ({ id, label, domId, ...extra });

export const AUTH_FLOW = Object.freeze({
  login: {
    initial: 'login',
    steps: {
      login: {
        id: 'login', type: 'form',
        fields: [field('email', 'email', 'miimiid-login-identifier', ['required', 'email'], { required: true }), field('password', 'password', 'miimiid-login-password', ['required', 'password'], { required: true })],
        primaryAction: action('login', 'authSignIn', 'miimiid-login-submit', { apiAction: 'login', nextStep: 'authenticated' })
      },
      authenticated: { id: 'authenticated', type: 'confirmation', fields: [], message: 'authAuthenticated' }
    }
  },
  register: {
    initial: 'welcome',
    steps: {
      welcome: { id: 'welcome', type: 'welcome', fields: [], primaryAction: action('start', 'authGetStarted', 'miimiid-register-get-started', { nextStep: 'name' }) },
      name: { id: 'name', type: 'form', fields: [field('firstName', 'text', 'miimiid-register-first-name', ['required'], { required: true }), field('lastName', 'text', 'miimiid-register-last-name', ['required'], { required: true })], primaryAction: action('name-next', 'authContinue', 'miimiid-register-name-next', { nextStep: 'email' }), previousStep: 'welcome' },
      email: { id: 'email', type: 'form', fields: [field('email', 'email', 'miimiid-register-email', ['required', 'email'], { required: true })], primaryAction: action('contact-next', 'authContinue', 'miimiid-register-contact-next', { nextStep: 'birthday' }), previousStep: 'name' },
      birthday: { id: 'birthday', type: 'form', fields: [field('gender', 'select', 'miimiid-register-gender', ['required', 'gender'], { required: true, options: ['male', 'female'] }), field('dateOfBirth', 'birthday', 'miimiid-register-dob', ['required', 'birthday'], { required: true })], primaryAction: action('details-next', 'authContinue', 'miimiid-register-details-next', { nextStep: 'password' }), previousStep: 'email' },
      password: { id: 'password', type: 'form', fields: [field('password', 'password', 'miimiid-register-password', ['required', 'password'], { required: true }), field('confirmPassword', 'password', 'miimiid-register-confirm', ['required', 'confirmation'], { required: true })], primaryAction: action('register', 'authCreateAccountButton', 'miimiid-register-submit', { apiAction: 'register', nextStep: 'verification' }), previousStep: 'birthday' },
      verification: { id: 'verification', type: 'verification', fields: [field('code', 'verification', 'miimiid-register-verification-code', ['required', 'verification'], { required: true })], primaryAction: action('verify', 'authVerifyAccount', 'miimiid-verify-account-submit', { apiAction: 'verify', nextStep: 'authenticated' }), secondaryActions: [action('resend', 'authResendCode', 'miimiid-resend-verification', { apiAction: 'resend' })], previousStep: 'password' },
      authenticated: { id: 'authenticated', type: 'confirmation', fields: [], message: 'authAuthenticated' }
    }
  },
  forgot: {
    initial: 'forgot',
    steps: {
      forgot: { id: 'forgot', type: 'recovery', fields: [field('email', 'email', 'miimiid-forgot-identifier', ['required', 'email'], { required: true })], primaryAction: action('forgot', 'authSendResetInstructions', 'miimiid-forgot-submit', { apiAction: 'forgot', nextStep: 'confirmation' }) },
      confirmation: { id: 'confirmation', type: 'confirmation', fields: [], message: 'authResetInstructionsSent' }
    }
  },
  reset: {
    initial: 'reset',
    steps: {
      reset: { id: 'reset', type: 'form', fields: [field('password', 'password', 'miimiid-reset-password', ['required', 'password'], { required: true }), field('confirmPassword', 'password', 'miimiid-reset-confirm', ['required', 'confirmation'], { required: true })], primaryAction: action('reset', 'authResetPasswordButton', 'miimiid-reset-submit', { apiAction: 'reset', nextStep: 'confirmation' }) },
      confirmation: { id: 'confirmation', type: 'confirmation', fields: [], message: 'authPasswordResetSuccess' }
    }
  }
});

export const AUTH_MODE_ACTIONS = Object.freeze([
  { domId: 'miimiid-show-register', flow: 'register' },
  { domId: 'miimiid-show-forgot', flow: 'forgot' },
  { domId: 'miimiid-show-login-from-register', flow: 'login' },
  { domId: 'miimiid-show-login-from-forgot', flow: 'login' },
  { domId: 'miimiid-show-login-from-reset', flow: 'login' }
]);
